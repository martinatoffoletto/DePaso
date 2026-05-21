"""
Base repository with generic CRUD operations.
Module-specific repositories inherit from this and add domain queries.
"""
from typing import TypeVar, Generic, Type

from sqlalchemy.orm import Session

T = TypeVar("T")


class BaseRepository(Generic[T]):
    """Generic repository providing standard CRUD operations.
    
    Usage:
        class UserRepository(BaseRepository[User]):
            def __init__(self, db: Session):
                super().__init__(User, db)
            
            def get_by_email(self, email: str) -> User | None:
                return self.db.query(self.model).filter(self.model.email == email).first()
    """

    def __init__(self, model: Type[T], db: Session) -> None:
        """Initialize with model class and database session."""
        self.model = model
        self.db = db

    def create(self, **kwargs: object) -> T:
        """Create a new entity."""
        instance = self.model(**kwargs)
        self.db.add(instance)
        self.db.commit()
        self.db.refresh(instance)
        return instance

    def get_by_id(self, entity_id: int) -> T | None:
        """Get an entity by its primary key."""
        return self.db.query(self.model).filter(self.model.id == entity_id).first()

    def list_all(self, skip: int = 0, limit: int = 20) -> tuple[list[T], int]:
        """List entities with pagination. Returns (items, total_count)."""
        query = self.db.query(self.model)
        total = query.count()
        items = query.offset(skip).limit(limit).all()
        return items, total

    def update(self, entity_id: int, **kwargs: object) -> T | None:
        """Update an entity by ID. Returns None if not found."""
        instance = self.get_by_id(entity_id)
        if not instance:
            return None
        for key, value in kwargs.items():
            if value is not None:
                setattr(instance, key, value)
        self.db.commit()
        self.db.refresh(instance)
        return instance

    def delete(self, entity_id: int) -> bool:
        """Hard delete an entity by ID. Returns True if deleted."""
        instance = self.get_by_id(entity_id)
        if not instance:
            return False
        self.db.delete(instance)
        self.db.commit()
        return True
