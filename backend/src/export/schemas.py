"""Export schemas: Pydantic serialization models for file export operations."""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class ExportCreate(BaseModel):
    format: Literal["pdf", "docx"] = Field(default="pdf")


class ExportOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    investigation_id: uuid.UUID
    org_id: uuid.UUID
    format: str
    storage_key: str
    download_url: str | None = None
    created_by: uuid.UUID
    created_at: datetime
