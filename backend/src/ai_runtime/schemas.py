"""AI Runtime schemas: Pydantic v2 models for request/response serialization."""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class CitationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    chunk_id: uuid.UUID | None = None
    text: str
    score: float
    source: str
    is_valid: bool = True


class HypothesisOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    investigation_id: uuid.UUID
    org_id: uuid.UUID
    title: str
    content: str
    evidence_citations: list[CitationOut] | None = None
    confidence_score: float | None = None
    grounding_score: float | None = None
    status: Literal["pending", "accepted", "rejected", "modified"]
    created_at: datetime
    reviewed_by: uuid.UUID | None = None
    reviewed_at: datetime | None = None


class HypothesisUpdate(BaseModel):
    status: Literal["accepted", "rejected", "modified"] | None = None
    title: str | None = None
    content: str | None = None


class CapaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    investigation_id: uuid.UUID
    org_id: uuid.UUID
    content: str
    status: Literal["draft", "review", "approved"]
    approved_by: uuid.UUID | None = None
    approved_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class CapaUpdate(BaseModel):
    content: str | None = None
    status: Literal["draft", "review", "approved"] | None = None


class CapaApproveRequest(BaseModel):
    approved: bool = Field(default=True)


class GenerateHypothesesRequest(BaseModel):
    num_hypotheses: int = Field(default=3, ge=1, le=5)


class GenerateCapaRequest(BaseModel):
    org_context: str = Field(default="")


class InvestigationSummaryOut(BaseModel):
    summary: str
    provider: str
    model: str
    cost_usd: float
    latency_ms: float

class AssessRequest(BaseModel):
    question: str = Field(..., description="The question or description to generate the assessment for.")
