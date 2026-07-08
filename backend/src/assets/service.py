"""Assets domain service layer: CRUD operations for assets."""
from __future__ import annotations

import logging
import uuid

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.assets.models import Asset
from src.assets.schemas import AssetCreate, AssetListOut, AssetOut, AssetUpdate

logger = logging.getLogger(__name__)


async def create_asset(
    db: AsyncSession,
    req: AssetCreate,
    org_id: uuid.UUID,
) -> AssetOut:
    """Create a new asset.

    Args:
        db: Async database session.
        req: Asset creation payload.
        org_id: Organisation UUID.

    Returns:
        Created AssetOut.

    Raises:
        HTTPException 409: Asset code already exists in the org.
    """
    existing = await db.execute(
        select(Asset).where(
            Asset.org_id == org_id,
            Asset.asset_code == req.asset_code,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Asset with code '{req.asset_code}' already exists in this organisation",
        )

    asset = Asset(
        org_id=org_id,
        asset_type=req.asset_type,
        asset_code=req.asset_code,
        name=req.name,
        metadata_=req.metadata,
    )
    db.add(asset)
    await db.flush()

    logger.info("Created asset %s (%s) in org %s", asset.id, req.asset_code, org_id)
    return AssetOut.model_validate(asset)


async def list_assets(
    db: AsyncSession,
    org_id: uuid.UUID,
    page: int = 1,
    page_size: int = 20,
    asset_type: str | None = None,
) -> AssetListOut:
    """List assets for an organisation with optional type filter."""
    page_size = min(page_size, 100)
    offset = (page - 1) * page_size

    query = select(Asset).where(Asset.org_id == org_id)
    if asset_type:
        query = query.where(Asset.asset_type == asset_type)

    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar_one()

    query = query.order_by(Asset.created_at.desc()).offset(offset).limit(page_size)
    result = await db.execute(query)
    items = result.scalars().all()

    return AssetListOut(
        items=[AssetOut.model_validate(a) for a in items],
        total=total,
    )


async def get_asset(
    db: AsyncSession, asset_id: uuid.UUID, org_id: uuid.UUID
) -> AssetOut:
    """Get a single asset by ID.

    Raises:
        HTTPException 404: Not found.
    """
    result = await db.execute(
        select(Asset).where(Asset.id == asset_id, Asset.org_id == org_id)
    )
    asset = result.scalar_one_or_none()
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Asset {asset_id} not found",
        )
    return AssetOut.model_validate(asset)


async def update_asset(
    db: AsyncSession,
    asset_id: uuid.UUID,
    org_id: uuid.UUID,
    req: AssetUpdate,
) -> AssetOut:
    """Partially update an asset.

    Raises:
        HTTPException 404: Not found.
    """
    result = await db.execute(
        select(Asset).where(Asset.id == asset_id, Asset.org_id == org_id)
    )
    asset = result.scalar_one_or_none()
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Asset {asset_id} not found",
        )

    if req.asset_type is not None:
        asset.asset_type = req.asset_type
    if req.name is not None:
        asset.name = req.name
    if req.metadata is not None:
        asset.metadata_ = req.metadata

    await db.flush()
    logger.info("Updated asset %s", asset_id)
    return AssetOut.model_validate(asset)
