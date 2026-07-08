"""Assets domain router."""
from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.assets import service
from src.assets.schemas import AssetCreate, AssetListOut, AssetOut, AssetUpdate
from src.core.dependencies import CurrentUser, get_db

router = APIRouter(prefix="/api/assets", tags=["Assets"])
DbDep = Annotated[AsyncSession, Depends(get_db)]


@router.post(
    "",
    response_model=AssetOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new asset",
)
async def create_asset(
    req: AssetCreate,
    current_user: CurrentUser,
    db: DbDep,
) -> AssetOut:
    return await service.create_asset(db, req, current_user.org_id)


@router.get("", response_model=AssetListOut, summary="List assets")
async def list_assets(
    current_user: CurrentUser,
    db: DbDep,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    asset_type: str | None = Query(None),
) -> AssetListOut:
    return await service.list_assets(db, current_user.org_id, page, page_size, asset_type)


@router.get("/{asset_id}", response_model=AssetOut, summary="Get asset by ID")
async def get_asset(
    asset_id: uuid.UUID,
    current_user: CurrentUser,
    db: DbDep,
) -> AssetOut:
    return await service.get_asset(db, asset_id, current_user.org_id)


@router.patch("/{asset_id}", response_model=AssetOut, summary="Update asset")
async def update_asset(
    asset_id: uuid.UUID,
    req: AssetUpdate,
    current_user: CurrentUser,
    db: DbDep,
) -> AssetOut:
    return await service.update_asset(db, asset_id, current_user.org_id, req)
