"""Auth domain Pydantic v2 schemas."""
from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


# ── Organization ──────────────────────────────────────────────────────────────

class OrganizationCreate(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    slug: str = Field(min_length=2, max_length=100, pattern=r"^[a-z0-9-]+$")


class OrganizationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    slug: str
    created_at: datetime


# ── Auth requests ─────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    """Request body for new user + org registration."""

    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str | None = Field(default=None, max_length=255)
    org_name: str = Field(min_length=2, max_length=255)
    org_slug: str = Field(min_length=2, max_length=100, pattern=r"^[a-z0-9-]+$")

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v


class LoginRequest(BaseModel):
    """Request body for email/password login."""

    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    """Request body for token refresh."""

    refresh_token: str


class InviteUserRequest(BaseModel):
    """Admin invites a new user to the org (no registration flow needed)."""

    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str | None = Field(default=None, max_length=255)
    role: str = Field(default="analyst")

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: str) -> str:
        allowed = {"admin", "analyst", "reviewer", "viewer"}
        if v not in allowed:
            raise ValueError(f"role must be one of {allowed}")
        return v


# ── Auth responses ────────────────────────────────────────────────────────────

class TokenResponse(BaseModel):
    """JWT token pair returned after successful login or refresh."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    """Public user representation."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: str
    full_name: str | None
    role: str
    org_id: uuid.UUID
    is_active: bool
    created_at: datetime


class MeResponse(BaseModel):
    """Response for GET /me — user + org info."""

    user: UserOut
    organization: OrganizationOut
