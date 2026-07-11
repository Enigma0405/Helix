"""Auth domain service layer: registration, login, token refresh."""
from __future__ import annotations

import logging
import uuid

import jwt
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.models import Organization, User
from src.auth.schemas import (
    InviteUserRequest,
    LoginRequest,
    MeResponse,
    OrganizationOut,
    RegisterRequest,
    TokenResponse,
    UserOut,
)
from src.shared.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)

logger = logging.getLogger(__name__)


async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    """Fetch a user by email address.

    Args:
        db: Async database session.
        email: Email address to look up.

    Returns:
        User ORM object or None.
    """
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def get_user_by_id(db: AsyncSession, user_id: uuid.UUID) -> User | None:
    """Fetch a user by UUID primary key.

    Args:
        db: Async database session.
        user_id: User UUID.

    Returns:
        User ORM object or None.
    """
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def get_org_by_id(db: AsyncSession, org_id: uuid.UUID) -> Organization | None:
    """Fetch an organisation by UUID primary key."""
    result = await db.execute(select(Organization).where(Organization.id == org_id))
    return result.scalar_one_or_none()


async def register_user(db: AsyncSession, req: RegisterRequest) -> TokenResponse:
    """Register a new user with a new organisation.

    Creates the org + user atomically. Returns JWT token pair.

    Raises:
        HTTPException 409: Email or org slug already in use.
    """
    # Check email uniqueness
    if await get_user_by_email(db, req.email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Email '{req.email}' is already registered",
        )

    # Check org slug uniqueness
    slug_result = await db.execute(
        select(Organization).where(Organization.slug == req.org_slug)
    )
    if slug_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Organisation slug '{req.org_slug}' is already taken",
        )

    # Create organisation
    org = Organization(name=req.org_name, slug=req.org_slug)
    db.add(org)
    await db.flush()  # assigns org.id without committing

    # Create user as admin of the new org
    user = User(
        email=req.email,
        hashed_password=hash_password(req.password),
        full_name=req.full_name,
        role="admin",
        org_id=org.id,
    )
    db.add(user)
    await db.flush()

    logger.info("Registered new user %s in org %s", user.email, org.slug)

    return TokenResponse(
        access_token=create_access_token(str(user.id), str(org.id), user.role),
        refresh_token=create_refresh_token(str(user.id)),
    )


async def login_user(db: AsyncSession, req: LoginRequest) -> TokenResponse:
    """Authenticate a user with email + password.

    Args:
        db: Async database session.
        req: Login credentials.

    Returns:
        JWT token pair.

    Raises:
        HTTPException 401: Invalid credentials.
        HTTPException 403: Inactive account.
    """
    user = await get_user_by_email(db, req.email)
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )

    logger.info("User %s logged in", user.email)

    return TokenResponse(
        access_token=create_access_token(str(user.id), str(user.org_id), user.role),
        refresh_token=create_refresh_token(str(user.id)),
    )


async def refresh_access_token(db: AsyncSession, refresh_token: str) -> TokenResponse:
    """Issue a new access token using a valid refresh token.

    Args:
        db: Async database session.
        refresh_token: JWT refresh token string.

    Returns:
        New JWT token pair.

    Raises:
        HTTPException 401: Invalid or expired refresh token.
    """
    try:
        payload = decode_token(refresh_token)
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has expired",
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token is not a refresh token",
        )

    user_id = uuid.UUID(payload["sub"])
    user = await get_user_by_id(db, user_id)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )

    return TokenResponse(
        access_token=create_access_token(str(user.id), str(user.org_id), user.role),
        refresh_token=create_refresh_token(str(user.id)),
    )


async def get_me(db: AsyncSession, user_id: uuid.UUID) -> MeResponse:
    """Return full user + org info for the authenticated user.

    Raises:
        HTTPException 404: User or org not found.
    """
    user = await get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    org = await get_org_by_id(db, user.org_id)
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Organisation not found"
        )

    return MeResponse(
        user=UserOut.model_validate(user),
        organization=OrganizationOut.model_validate(org),
    )


async def invite_user(
    db: AsyncSession,
    req: InviteUserRequest,
    org_id: uuid.UUID,
) -> UserOut:
    """Admin-only: invite a new user into the current organisation.

    Args:
        db: Async database session.
        req: Invitation request with email, password, role.
        org_id: UUID of the inviting organisation.

    Returns:
        Created UserOut schema.

    Raises:
        HTTPException 409: Email already registered.
    """
    if await get_user_by_email(db, req.email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Email '{req.email}' is already registered",
        )

    user = User(
        email=req.email,
        hashed_password=hash_password(req.password),
        full_name=req.full_name,
        role=req.role,
        org_id=org_id,
    )
    db.add(user)
    await db.flush()
    logger.info("Admin invited user %s with role %s", user.email, user.role)
    return UserOut.model_validate(user)
