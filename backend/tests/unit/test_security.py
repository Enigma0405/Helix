"""Unit tests for security and token processing functions."""
from __future__ import annotations

import jwt
import pytest

from src.shared.config import settings
from src.shared.security import create_access_token, create_refresh_token, decode_token, hash_password, verify_password


def test_password_hashing():
    password = "secret_password"
    hashed = hash_password(password)
    
    assert hashed != password
    assert verify_password(password, hashed)
    assert not verify_password("wrong_password", hashed)


def test_jwt_token_flow():
    user_id = "00000000-0000-0000-0000-000000000010"
    org_id = "00000000-0000-0000-0000-000000000001"
    role = "analyst"
    
    token = create_access_token(user_id=user_id, org_id=org_id, role=role)
    assert isinstance(token, str)
    
    decoded = decode_token(token)
    assert decoded["sub"] == user_id
    assert decoded["org_id"] == org_id
    assert decoded["role"] == role
    assert decoded["type"] == "access"


def test_expired_token():
    # Set expiration time to negative to force expiry
    from datetime import timedelta
    from src.shared.security import _build_payload
    
    payload = _build_payload(
        subject="test_user",
        token_type="access",
        expires_delta=timedelta(minutes=-5)
    )
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    
    with pytest.raises(jwt.ExpiredSignatureError):
        decode_token(token)
