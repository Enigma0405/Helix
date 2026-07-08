"""Investigation domain Pydantic v2 schemas."""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


# ── Investigation ─────────────────────────────────────────────────────────────

SEVERITY = Literal["critical", "high", "medium", "low"]
STATUS = Literal["open", "in_progress", "pending_review", "closed"]


class InvestigationCreate(BaseModel):
    title: str = Field(min_length=3, max_length=500)
    description: str | None = Field(default=None, max_length=10_000)
    severity: SEVERITY = "medium"


class InvestigationUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=3, max_length=500)
    description: str | None = Field(default=None, max_length=10_000)
    severity: SEVERITY | None = None
    status: STATUS | None = None


class InvestigationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    org_id: uuid.UUID
    title: str
    description: str | None
    severity: str
    status: str
    created_by: uuid.UUID
    closed_at: datetime | None
    created_at: datetime
    updated_at: datetime


class InvestigationListOut(BaseModel):
    items: list[InvestigationOut]
    total: int
    page: int
    page_size: int


# ── Comment ───────────────────────────────────────────────────────────────────

class CommentCreate(BaseModel):
    content: str = Field(min_length=1, max_length=10_000)
    entity_type: str = Field(default="investigation", max_length=100)
    entity_id: uuid.UUID


class CommentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    org_id: uuid.UUID
    entity_type: str
    entity_id: uuid.UUID
    content: str
    author_id: uuid.UUID
    created_at: datetime


# ── Task ──────────────────────────────────────────────────────────────────────

TASK_STATUS = Literal["open", "in_progress", "done"]


class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=500)
    description: str | None = Field(default=None, max_length=5_000)
    assignee_id: uuid.UUID | None = None
    due_date: datetime | None = None


class TaskUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=500)
    description: str | None = None
    assignee_id: uuid.UUID | None = None
    status: TASK_STATUS | None = None
    due_date: datetime | None = None


class TaskOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    investigation_id: uuid.UUID
    org_id: uuid.UUID
    title: str
    description: str | None
    assignee_id: uuid.UUID | None
    status: str
    due_date: datetime | None
    created_at: datetime


# ── Timeline ──────────────────────────────────────────────────────────────────

class TimelineEvent(BaseModel):
    """Single event in the investigation timeline."""

    timestamp: datetime
    event_type: str  # audit action type
    actor_id: uuid.UUID | None
    entity_type: str
    description: str


class TimelineOut(BaseModel):
    investigation_id: uuid.UUID
    events: list[TimelineEvent]
