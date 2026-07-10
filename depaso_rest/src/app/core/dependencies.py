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


# Type alias for dependency injection
CurrentUserId = Annotated[int, Depends(get_current_user_id)]
DatabaseSession = Annotated[AsyncSession, Depends(get_db)]
