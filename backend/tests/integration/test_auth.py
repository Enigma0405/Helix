"""Integration tests for Auth endpoints."""
from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_and_login_flow(client: AsyncClient):
    # 1. Register a new organization and first user
    reg_payload = {
        "email": "new_admin@helix.ai",
        "password": "SecurePassword123",
        "full_name": "Dr. Sarah Chen",
        "org_name": "Helix Laboratories Inc.",
        "org_slug": "helix-labs"
    }
    
    reg_response = await client.post("/api/auth/register", json=reg_payload)
    assert reg_response.status_code == 201
    
    reg_data = reg_response.json()
    assert "access_token" in reg_data
    assert "refresh_token" in reg_data
    
    # 2. Login with the created credentials
    login_payload = {
        "email": "new_admin@helix.ai",
        "password": "SecurePassword123"
    }
    
    login_response = await client.post("/api/auth/login", json=login_payload)
    assert login_response.status_code == 200
    
    login_data = login_response.json()
    assert "access_token" in login_data
    
    # 3. Retrieve user profile details using the access token
    headers = {"Authorization": f"Bearer {login_data['access_token']}"}
    me_response = await client.get("/api/auth/me", headers=headers)
    assert me_response.status_code == 200
    
    me_data = me_response.json()
    assert me_data["user"]["email"] == "new_admin@helix.ai"
    assert me_data["user"]["full_name"] == "Dr. Sarah Chen"
    assert "organization" in me_data
    assert me_data["organization"]["name"] == "Helix Laboratories Inc."
