"""FastAPI dependencies: get_current_user, RoleChecker, get_db re-export."""
from __future__ import annotations

import uuid
from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.security import decode_token

# Re-export for convenience
__all__ = ["get_db", "get_current_user", "RoleChecker", "CurrentUser"]

bearer_scheme = HTTPBearer(auto_error=True)


class _CurrentUserPayload:
    """Lightweight container for the decoded JWT claims."""

    __slots__ = ("user_id", "org_id", "role")

    def __init__(self, user_id: uuid.UUID, org_id: uuid.UUID, role: str) -> None:
        self.user_id = user_id
        self.org_id = org_id
        self.role = role


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(bearer_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> _CurrentUserPayload:
    """Validate Bearer JWT and return a lightweight user payload.

    Raises:
        HTTPException 401: Token missing, expired, or invalid.
        HTTPException 403: User is inactive.
    """
    credentials_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_token(credentials.credentials)
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise credentials_exc

    if payload.get("type") != "access":
        raise credentials_exc

    user_id_str: str | None = payload.get("sub")
    org_id_str: str | None = payload.get("org_id")
    role: str | None = payload.get("role")

    if not user_id_str or not org_id_str or not role:
        raise credentials_exc

    try:
        user_id = uuid.UUID(user_id_str)
        org_id = uuid.UUID(org_id_str)
    except ValueError:
        raise credentials_exc

    # Lazily import User model here to avoid circular imports
    from src.auth.models import User  # noqa: PLC0415

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise credentials_exc
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )

    return _CurrentUserPayload(user_id=user_id, org_id=org_id, role=role)


# Type alias for injection
CurrentUser = Annotated[_CurrentUserPayload, Depends(get_current_user)]


class RoleChecker:
    """Dependency factory that restricts access to specific roles.

    Usage::

        router = APIRouter(dependencies=[Depends(RoleChecker(["admin", "analyst"]))])
    """

    def __init__(self, allowed_roles: list[str]) -> None:
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: CurrentUser) -> _CurrentUserPayload:
        if current_user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{current_user.role}' is not permitted for this action. "
                f"Required: {self.allowed_roles}",
            )
        return current_user
