"""
Matching module repository — persistence of admin-tunable scoring weights.
"""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.app.modules.matching.models import MatchingWeight


class MatchingWeightsRepository:
    """Reads/writes the scoring weights stored in DB (RF-ADM)."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def load(self, defaults: dict[str, float]) -> dict[str, float]:
        """Weights from DB merged over the code defaults."""
        weights = defaults.copy()
        rows = (await self.db.execute(select(MatchingWeight))).scalars().all()
        for row in rows:
            if row.name in weights:
                weights[row.name] = row.value
        return weights

    async def save(self, updates: dict[str, float]) -> None:
        """Upsert the given components."""
        for name, value in updates.items():
            row = (
                await self.db.execute(
                    select(MatchingWeight).where(MatchingWeight.name == name)
                )
            ).scalar_one_or_none()
            if row:
                row.value = value
            else:
                self.db.add(MatchingWeight(name=name, value=value))
        await self.db.flush()
