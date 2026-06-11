"""
Matching module repository — persistence of admin-tunable scoring weights.
"""
from sqlalchemy.orm import Session

from src.app.modules.matching.models import MatchingWeight


class MatchingWeightsRepository:
    """Reads/writes the scoring weights stored in DB (RF-ADM)."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def load(self, defaults: dict[str, float]) -> dict[str, float]:
        """Weights from DB merged over the code defaults."""
        weights = defaults.copy()
        for row in self.db.query(MatchingWeight).all():
            if row.name in weights:
                weights[row.name] = row.value
        return weights

    def save(self, updates: dict[str, float]) -> None:
        """Upsert the given components."""
        for name, value in updates.items():
            row = (
                self.db.query(MatchingWeight)
                .filter(MatchingWeight.name == name)
                .first()
            )
            if row:
                row.value = value
            else:
                self.db.add(MatchingWeight(name=name, value=value))
        self.db.commit()
