"""
Vision module API router.
"""
from pathlib import Path
from uuid import uuid4

import structlog
from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.concurrency import run_in_threadpool

from src.app.core.database import get_db
from src.app.core.dependencies import CurrentUserId
from src.app.modules.vision.models import Classification
from src.app.modules.vision.schemas import (
    ClassificationFeedback,
    ClassificationLogEntry,
    ClassificationResponse,
)

router = APIRouter(prefix="/vision", tags=["vision"])
logger = structlog.get_logger(__name__)

MAX_IMAGE_BYTES = 10 * 1024 * 1024  # 10 MB

# Las fotos de paquetes se sirven estáticamente desde /media (mount en main.py).
MEDIA_PACKAGES_DIR = Path("uploads") / "packages"


@router.post("/classify", response_model=ClassificationResponse)
async def classify_image(
    request: Request,
    current_user_id: CurrentUserId,
    image: UploadFile = File(...),
    has_reference_object: bool = Form(False),
    db: AsyncSession = Depends(get_db),
):
    """Classify a package photo into a size category (RF-VIS-01).

    Every prediction is logged for future fine-tuning and bias auditing
    (RF-VIS-04). When confidence < threshold the response sets needs_manual
    so the UI offers manual category input (RF-VIS-02 / RF-SHP-03).
    """
    if not (image.content_type or "").startswith("image/"):
        raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                            detail="File must be an image")

    # Leer con límite: read(N) no carga en RAM más de N bytes. Sin esto,
    # image.read() cargaría el archivo ENTERO antes de validar el tamaño
    # (un upload gigante tumbaría el proceso por OOM).
    image_bytes = await image.read(MAX_IMAGE_BYTES + 1)
    if len(image_bytes) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=status.HTTP_413_CONTENT_TOO_LARGE,
                            detail="Image too large (max 10 MB)")
    if not image_bytes:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                            detail="Empty image")

    classifier = request.app.state.classifier
    # model.predict es CPU-bound: al threadpool, así no congela el event loop.
    try:
        result = await run_in_threadpool(
            classifier.classify, image_bytes, has_reference_object=has_reference_object
        )
    except Exception as exc:
        # Imagen ilegible/corrupta (decode falla): 422, no un 500 genérico.
        # Se loguea para no perder de vista un fallo real del modelo en la demo.
        logger.warning("vision_classify_failed", error=str(exc))
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                            detail="Could not process image")

    record = Classification(
        user_id=current_user_id,
        predicted_category=result["category"],
        confidence=result["confidence"],
        has_reference_object=has_reference_object,
        model_loaded=result["model_loaded"],
    )
    db.add(record)
    await db.flush()
    await db.refresh(record)

    # Persistir la foto para adjuntarla al envío: sin esto la imagen moría
    # tras clasificar y el photo_url del shipment quedaba siempre vacío
    # (el feed del carrier y "Mis envíos" la renderizan).
    photo_url: str | None = None
    try:
        name = f"{uuid4().hex}.jpg"
        path = MEDIA_PACKAGES_DIR / name
        await run_in_threadpool(path.write_bytes, image_bytes)
        photo_url = f"{request.base_url}media/packages/{name}"
    except OSError as exc:
        # La foto es accesoria: si el disco falla, la clasificación igual sale.
        logger.warning("vision_photo_save_failed", error=str(exc))

    return ClassificationResponse(classification_id=record.id, photo_url=photo_url, **result)


@router.patch("/classifications/{classification_id}", response_model=ClassificationLogEntry)
async def classification_feedback(
    classification_id: int,
    data: ClassificationFeedback,
    current_user_id: CurrentUserId,
    db: AsyncSession = Depends(get_db),
):
    """Record whether the user accepted the suggestion or corrected it (RF-VIS-04)."""
    record = (
        await db.execute(select(Classification).where(Classification.id == classification_id))
    ).scalar_one_or_none()
    if not record or record.user_id != current_user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="Classification not found")
    record.accepted = data.accepted
    record.manual_category = data.manual_category
    await db.flush()
    await db.refresh(record)
    return ClassificationLogEntry.model_validate(record)


@router.get("/classifications", response_model=list[ClassificationLogEntry])
async def list_my_classifications(
    current_user_id: CurrentUserId,
    db: AsyncSession = Depends(get_db),
):
    """The current user's classification history (RF-VIS-04)."""
    records = (
        await db.execute(
            select(Classification)
            .where(Classification.user_id == current_user_id)
            .order_by(Classification.created_at.desc())
            .limit(50)
        )
    ).scalars().all()
    return [ClassificationLogEntry.model_validate(r) for r in records]
