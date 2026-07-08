"""Assets domain Pydantic v2 schemas."""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

ASSET_TYPES = Literal["machine", "production_line", "sensor", "lab", "equipment"]


class AssetCreate(BaseModel):
    asset_type: ASSET_TYPES
    asset_code: str = Field(min_length=1, max_length=100)
    name: str = Field(min_length=2, max_length=500)
    metadata: dict | None = Field(default=None)


class AssetUpdate(BaseModel):
    asset_type: ASSET_TYPES | None = None
    name: str | None = Field(default=None, min_length=2, max_length=500)
    metadata: dict | None = None


class AssetOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    org_id: uuid.UUID
    asset_type: str
    asset_code: str
    name: str
    metadata_: dict | None = None
    created_at: datetime


class AssetListOut(BaseModel):
    items: list[AssetOut]
    total: int
