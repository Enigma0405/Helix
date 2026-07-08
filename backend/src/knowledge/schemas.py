"""Knowledge domain Pydantic v2 schemas."""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


DOC_TYPES = Literal["capa", "sop", "manual", "general"]


class DocumentCreate(BaseModel):
    title: str = Field(min_length=2, max_length=500)
    doc_type: DOC_TYPES = "general"


class DocumentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    org_id: uuid.UUID
    title: str
    storage_key: str
    doc_type: str
    created_by: uuid.UUID
    created_at: datetime


class DocumentListOut(BaseModel):
    items: list[DocumentOut]
    total: int


class ChunkOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    source_id: uuid.UUID
    source_type: str
    org_id: uuid.UUID
    content: str
    chunk_index: int
    metadata_: dict | None = None
    created_at: datetime


# ── Search ────────────────────────────────────────────────────────────────────

class SearchRequest(BaseModel):
    query: str = Field(min_length=3, max_length=2000)
    top_k: int = Field(default=10, ge=1, le=50)
    source_types: list[str] = Field(
        default=["evidence", "document"],
        description="Filter by source types: 'evidence' and/or 'document'",
    )
    investigation_id: uuid.UUID | None = Field(
        default=None,
        description="Optional: scope search to a specific investigation's evidence",
    )


class SearchResult(BaseModel):
    chunk_id: uuid.UUID
    source_id: uuid.UUID
    source_type: str
    content: str
    score: float  # cosine similarity [0, 1]
    metadata: dict | None = None


class SearchResponse(BaseModel):
    query: str
    results: list[SearchResult]
    total: int
