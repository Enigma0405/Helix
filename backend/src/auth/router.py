"""Auth domain router: register, login, refresh, me, invite."""
from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth import service
from src.auth.schemas import (
    InviteUserRequest,
    LoginRequest,
    MeResponse,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
    UserOut,
)
from src.api.dependencies import CurrentUser, RoleChecker, get_db

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

DbDep = Annotated[AsyncSession, Depends(get_db)]


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user and organisation",
)
async def register(req: RegisterRequest, db: DbDep) -> TokenResponse:
    """Create a new organisation and its first admin user."""
    return await service.register_user(db, req)


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Authenticate with email and password",
)
async def login(req: LoginRequest, db: DbDep) -> TokenResponse:
    """Return JWT access + refresh tokens for valid credentials."""
    return await service.login_user(db, req)


@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Refresh access token using refresh token",
)
async def refresh(req: RefreshRequest, db: DbDep) -> TokenResponse:
    """Exchange a refresh token for a new token pair."""
    return await service.refresh_access_token(db, req.refresh_token)


@router.get(
    "/me",
    response_model=MeResponse,
    summary="Get current user profile",
)
async def me(current_user: CurrentUser, db: DbDep) -> MeResponse:
    """Return authenticated user info and organisation details."""
    return await service.get_me(db, current_user.user_id)


@router.post(
    "/invite",
    response_model=UserOut,
    status_code=status.HTTP_201_CREATED,
    summary="Admin: invite a new user to the organisation",
    dependencies=[Depends(RoleChecker(["admin"]))],
)
async def invite(
    req: InviteUserRequest,
    current_user: CurrentUser,
    db: DbDep,
) -> UserOut:
    """Admin-only endpoint to create a new user within the current org."""
    return await service.invite_user(db, req, current_user.org_id)
