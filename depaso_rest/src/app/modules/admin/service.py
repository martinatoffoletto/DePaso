"""
Admin module service (RF-ADM).

Cross-cutting reporting/moderation logic. Reads across several domains
(users, carriers, shipments, vision) so it works directly against the session
rather than a single repository; the router stays thin (auth + delegate).
"""
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from src.app.core.config import settings
from src.app.modules.carriers.models import Carrier
from src.app.modules.shipments.models import Shipment, ShipmentEvent
from src.app.modules.users.models import User
from src.app.modules.vision.models import Classification
from src.app.shared.enums import ShipmentStatus
from src.app.shared.exceptions import ValidationError

ACTIVE_STATUSES = (
    ShipmentStatus.ASSIGNED,
    ShipmentStatus.PICKUP_ARRIVED,
    ShipmentStatus.IN_TRANSIT,
)

VALID_MODERATION_ACTIONS = {"verify", "suspend", "reactivate"}


class AdminService:
    """Operational monitoring and carrier moderation for the admin panel."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def _count(self, model, *filters) -> int:
        q = select(func.count(model.id))
        for f in filters:
            q = q.where(f)
        return (await self.db.execute(q)).scalar() or 0

    async def dashboard(self) -> dict:
        """Operational aggregates for the monitoring panel (RF-ADM-01/02)."""
        delivered = await self._count(Shipment, Shipment.status == ShipmentStatus.DELIVERED)
        cancelled = await self._count(Shipment, Shipment.status == ShipmentStatus.CANCELLED)
        closed = delivered + cancelled
        co2_total = (
            await self.db.execute(
                select(func.coalesce(func.sum(Shipment.co2_savings_kg), 0.0)).where(
                    Shipment.status == ShipmentStatus.DELIVERED
                )
            )
        ).scalar()
        return {
            "total_users": await self._count(User),
            "total_carriers": await self._count(Carrier),
            "carriers_pending_verification": await self._count(
                Carrier, Carrier.is_verified == False, Carrier.is_active == True  # noqa: E712
            ),
            "shipments_total": await self._count(Shipment),
            "shipments_active": await self._count(Shipment, Shipment.status.in_(ACTIVE_STATUSES)),
            "shipments_delivered": delivered,
            "shipments_pending": await self._count(Shipment, Shipment.status == ShipmentStatus.PENDING),
            "total_co2_saved_kg": round(float(co2_total), 3),
            "matching_success_rate": round(delivered / closed, 4) if closed else 0.0,
        }

    async def pending_carriers(self) -> list[Carrier]:
        """Carriers awaiting verification (RF-USR-07)."""
        result = await self.db.execute(
            select(Carrier)
            .where(Carrier.is_verified == False, Carrier.is_active == True)  # noqa: E712
            .order_by(Carrier.created_at)
        )
        return list(result.scalars().all())

    async def moderate_carrier(self, carrier_id: int, action: str) -> Carrier | None:
        """Verify / suspend / reactivate a carrier. Returns None if not found;
        raises ValidationError for an invalid action."""
        if action not in VALID_MODERATION_ACTIONS:
            raise ValidationError("action must be verify | suspend | reactivate", code="INVALID_ACTION")
        carrier = (
            await self.db.execute(select(Carrier).where(Carrier.id == carrier_id))
        ).scalar_one_or_none()
        if not carrier:
            return None
        if action == "verify":
            carrier.is_verified = True
        elif action == "suspend":
            carrier.is_active = False
        elif action == "reactivate":
            carrier.is_active = True
        await self.db.flush()
        await self.db.refresh(carrier)
        return carrier

    async def system_status(self, classifier) -> dict:
        """API/DB health + whether the vision model is loaded or on the stub."""
        try:
            await self.db.execute(text("SELECT 1"))
            database = "ok"
        except Exception:  # noqa: BLE001 - health probe must never raise
            database = "error"
        vision_loaded = bool(
            classifier is not None and getattr(classifier, "model", None) is not None
        )
        return {
            "api": "ok",
            "environment": settings.environment,
            "debug": settings.debug,
            "database": database,
            "vision_model_loaded": vision_loaded,
            "vision_model_path": settings.vision_model_path,
        }

    async def recent_activity(self, limit: int = 20) -> dict:
        """Latest classifications and shipment status changes."""
        limit = max(1, min(limit, 100))
        classifications = (
            await self.db.execute(
                select(Classification).order_by(Classification.created_at.desc()).limit(limit)
            )
        ).scalars().all()
        events = (
            await self.db.execute(
                select(ShipmentEvent).order_by(ShipmentEvent.created_at.desc()).limit(limit)
            )
        ).scalars().all()
        return {"classifications": list(classifications), "events": list(events)}
