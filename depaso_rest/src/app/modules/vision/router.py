"""
Vision module API router.
"""
from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile, status
from sqlalchemy.orm import Session

from src.app.core.database import get_db
from src.app.core.dependencies import CurrentUserId
from src.app.modules.vision.models import Classification
from src.app.modules.vision.schemas import (
    ClassificationFeedback,
    ClassificationLogEntry,
    ClassificationResponse,
)

router = APIRouter(prefix="/vision", tags=["vision"])

MAX_IMAGE_BYTES = 10 * 1024 * 1024  # 10 MB


@router.post("/classify", response_model=ClassificationResponse)
async def classify_image(
    request: Request,
    current_user_id: CurrentUserId,
    image: UploadFile = File(...),
    has_reference_object: bool = Form(False),
    db: Session = Depends(get_db),
):
    """Classify a package photo into a size category (RF-VIS-01).

    Every prediction is logged for future fine-tuning and bias auditing
    (RF-VIS-04). When confidence < threshold the response sets needs_manual
    so the UI offers manual category input (RF-VIS-02 / RF-SHP-03).
    """
    image_bytes = await image.read()
    if len(image_bytes) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=status.HTTP_413_CONTENT_TOO_LARGE,
                            detail="Image too large (max 10 MB)")

    classifier = request.app.state.classifier
    result = classifier.classify(image_bytes, has_reference_object=has_reference_object)

    record = Classification(
        user_id=current_user_id,
        predicted_category=result["category"],
        confidence=result["confidence"],
        has_reference_object=has_reference_object,
        model_loaded=result["model_loaded"],
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return ClassificationResponse(classification_id=record.id, **result)


@router.patch("/classifications/{classification_id}", response_model=ClassificationLogEntry)
async def classification_feedback(
    classification_id: int,
    data: ClassificationFeedback,
    current_user_id: CurrentUserId,
    db: Session = Depends(get_db),
):
    """Record whether the user accepted the suggestion or corrected it (RF-VIS-04)."""
    record = db.query(Classification).filter(Classification.id == classification_id).first()
    if not record or record.user_id != current_user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="Classification not found")
    record.accepted = data.accepted
    record.manual_category = data.manual_category
    db.commit()
    db.refresh(record)
    return ClassificationLogEntry.model_validate(record)


@router.get("/classifications", response_model=list[ClassificationLogEntry])
async def list_my_classifications(
    current_user_id: CurrentUserId,
    db: Session = Depends(get_db),
):
    """The current user's classification history (RF-VIS-04)."""
    records = (
        db.query(Classification)
        .filter(Classification.user_id == current_user_id)
        .order_by(Classification.created_at.desc())
        .limit(50)
        .all()
    )
    return [ClassificationLogEntry.model_validate(r) for r in records]
