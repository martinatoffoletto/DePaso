"""
Shared dependencies for FastAPI endpoints.
"""
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from src.app.core.database import get_db
from src.app.core.security import decode_access_token
from src.app.shared.exceptions import ForbiddenError

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")

async def get_current_user_id(token: str = Depends(oauth2_scheme)) -> int:
    """
    Extract and validate JWT token, return user_id.
    Raises HTTPException with 401 status if token is invalid.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_access_token(token)
        user_id_str = payload.get("sub")
        if user_id_str is None:
            raise credentials_exception
        user_id = int(user_id_str)
    except (JWTError, ValueError):
        raise credentials_exception

    return user_id


async def require_admin(
    current_user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> int:
    """Guard: solo usuarios con user_type == 'admin'. Devuelve su id.

    Se usa en operaciones administrativas (CRUD de users/carriers por id,
    listados globales). Un usuario normal con token válido recibe 403.
    """
    from sqlalchemy import select
    from src.app.modules.users.models import User

    user = (
        await db.execute(select(User).where(User.id == current_user_id))
    ).scalar_one_or_none()
    if not user or user.user_type != "admin":
        raise ForbiddenError("Admin access required", code="ADMIN_REQUIRED")
    return current_user_id


# Type alias for dependency injection
CurrentUserId = Annotated[int, Depends(get_current_user_id)]
AdminUserId = Annotated[int, Depends(require_admin)]
DatabaseSession = Annotated[AsyncSession, Depends(get_db)]
