"""JWT token creation/verification and password hashing utilities."""
from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

import jwt
from passlib.context import CryptContext

from src.shared.config import settings

# ── Password hashing ──────────────────────────────────────────────────────────
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain: str) -> str:
    """Hash a plain-text password using bcrypt."""
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    """Verify a plain-text password against a bcrypt hash."""
    return pwd_context.verify(plain, hashed)


# ── JWT helpers ───────────────────────────────────────────────────────────────

def _build_payload(
    subject: str,
    token_type: str,
    expires_delta: timedelta,
    extra: dict | None = None,
) -> dict:
    now = datetime.now(timezone.utc)
    payload: dict = {
        "sub": subject,
        "type": token_type,
        "iat": now,
        "exp": now + expires_delta,
        "jti": str(uuid.uuid4()),
    }
    if extra:
        payload.update(extra)
    return payload


def create_access_token(
    user_id: str,
    org_id: str,
    role: str,
) -> str:
    """Create a short-lived JWT access token.

    Args:
        user_id: UUID string of the user.
        org_id: UUID string of the user's organisation.
        role: User role string (admin|analyst|reviewer|viewer).

    Returns:
        Encoded JWT string.
    """
    payload = _build_payload(
        subject=user_id,
        token_type="access",
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        extra={"org_id": org_id, "role": role},
    )
    # PyJWT returns str directly — no .decode() needed
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    """Create a long-lived JWT refresh token.

    Args:
        user_id: UUID string of the user.

    Returns:
        Encoded JWT string.
    """
    payload = _build_payload(
        subject=user_id,
        token_type="refresh",
        expires_delta=timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> dict:
    """Decode and verify a JWT token.

    Args:
        token: Raw JWT string.

    Returns:
        Decoded payload dict.

    Raises:
        jwt.ExpiredSignatureError: Token has expired.
        jwt.InvalidTokenError: Token is invalid.
    """
    return jwt.decode(
        token,
        settings.SECRET_KEY,
        algorithms=[settings.ALGORITHM],
    )
