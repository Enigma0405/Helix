"""Evidence domain Pydantic v2 schemas."""
from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class EvidenceUploadOut(BaseModel):
    """Response after a successful evidence upload (before processing)."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    investigation_id: uuid.UUID
    org_id: uuid.UUID
    filename: str
    original_filename: str
    storage_key: str
    mime_type: str
    file_size_bytes: int | None
    status: str
    page_count: int | None
    uploaded_by: uuid.UUID
    created_at: datetime


class EvidenceListOut(BaseModel):
    items: list[EvidenceUploadOut]
    total: int


class EvidenceProcessingStatus(BaseModel):
    """Processing status update for an evidence item."""

    id: uuid.UUID
    status: str
    error_message: str | None
    page_count: int | None
    chunk_count: int | None = None
