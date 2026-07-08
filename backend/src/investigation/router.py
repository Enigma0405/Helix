"""Investigation domain router."""
from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.dependencies import CurrentUser, RoleChecker, get_db
from src.investigation import service
from src.investigation.schemas import (
    CommentCreate,
    CommentOut,
    InvestigationCreate,
    InvestigationListOut,
    InvestigationOut,
    InvestigationUpdate,
    TaskCreate,
    TaskOut,
    TaskUpdate,
    TimelineOut,
)

router = APIRouter(prefix="/api/investigations", tags=["Investigations"])
DbDep = Annotated[AsyncSession, Depends(get_db)]


@router.post(
    "",
    response_model=InvestigationOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new investigation",
)
async def create_investigation(
    req: InvestigationCreate,
    current_user: CurrentUser,
    db: DbDep,
) -> InvestigationOut:
    return await service.create_investigation(
        db, req, current_user.org_id, current_user.user_id
    )


@router.get(
    "",
    response_model=InvestigationListOut,
    summary="List investigations",
)
async def list_investigations(
    current_user: CurrentUser,
    db: DbDep,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status_filter: str | None = Query(None, alias="status"),
    severity_filter: str | None = Query(None, alias="severity"),
) -> InvestigationListOut:
    return await service.list_investigations(
        db, current_user.org_id, page, page_size, status_filter, severity_filter
    )


@router.get(
    "/{investigation_id}",
    response_model=InvestigationOut,
    summary="Get investigation by ID",
)
async def get_investigation(
    investigation_id: uuid.UUID,
    current_user: CurrentUser,
    db: DbDep,
) -> InvestigationOut:
    return await service.get_investigation(db, investigation_id, current_user.org_id)


@router.patch(
    "/{investigation_id}",
    response_model=InvestigationOut,
    summary="Update investigation fields",
)
async def update_investigation(
    investigation_id: uuid.UUID,
    req: InvestigationUpdate,
    current_user: CurrentUser,
    db: DbDep,
) -> InvestigationOut:
    return await service.update_investigation(
        db, investigation_id, current_user.org_id, req, current_user.user_id
    )


@router.delete(
    "/{investigation_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete investigation",
    dependencies=[Depends(RoleChecker(["admin"]))],
)
async def delete_investigation(
    investigation_id: uuid.UUID,
    current_user: CurrentUser,
    db: DbDep,
) -> None:
    await service.delete_investigation(
        db, investigation_id, current_user.org_id, current_user.user_id
    )


@router.get(
    "/{investigation_id}/timeline",
    response_model=TimelineOut,
    summary="Get investigation audit timeline",
)
async def get_timeline(
    investigation_id: uuid.UUID,
    current_user: CurrentUser,
    db: DbDep,
) -> TimelineOut:
    return await service.get_timeline(db, investigation_id, current_user.org_id)


# ── Comments ──────────────────────────────────────────────────────────────────

comments_router = APIRouter(prefix="/api", tags=["Comments"])


@comments_router.post(
    "/investigations/{investigation_id}/comments",
    response_model=CommentOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_comment(
    investigation_id: uuid.UUID,
    req: CommentCreate,
    current_user: CurrentUser,
    db: DbDep,
) -> CommentOut:
    req.entity_id = investigation_id
    req.entity_type = "investigation"
    return await service.create_comment(db, req, current_user.org_id, current_user.user_id)


@comments_router.get(
    "/investigations/{investigation_id}/comments",
    response_model=list[CommentOut],
)
async def list_comments(
    investigation_id: uuid.UUID,
    current_user: CurrentUser,
    db: DbDep,
) -> list[CommentOut]:
    return await service.list_comments(
        db, investigation_id, "investigation", current_user.org_id
    )


# ── Tasks ─────────────────────────────────────────────────────────────────────

tasks_router = APIRouter(prefix="/api/investigations", tags=["Tasks"])


@tasks_router.post(
    "/{investigation_id}/tasks",
    response_model=TaskOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_task(
    investigation_id: uuid.UUID,
    req: TaskCreate,
    current_user: CurrentUser,
    db: DbDep,
) -> TaskOut:
    return await service.create_task(
        db, investigation_id, current_user.org_id, req, current_user.user_id
    )


@tasks_router.get("/{investigation_id}/tasks", response_model=list[TaskOut])
async def list_tasks(
    investigation_id: uuid.UUID,
    current_user: CurrentUser,
    db: DbDep,
) -> list[TaskOut]:
    return await service.list_tasks(db, investigation_id, current_user.org_id)


tasks_patch_router = APIRouter(prefix="/api/tasks", tags=["Tasks"])


@tasks_patch_router.patch("/{task_id}", response_model=TaskOut)
async def update_task(
    task_id: uuid.UUID,
    req: TaskUpdate,
    current_user: CurrentUser,
    db: DbDep,
) -> TaskOut:
    return await service.update_task(db, task_id, current_user.org_id, req, current_user.user_id)
