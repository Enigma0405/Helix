"""Investigation domain service layer: CRUD, comments, tasks, timeline."""
from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.audit import AuditLog, write_audit
from src.investigation.models import Comment, Investigation, Task
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
    TimelineEvent,
    TimelineOut,
)

logger = logging.getLogger(__name__)


async def create_investigation(
    db: AsyncSession,
    req: InvestigationCreate,
    org_id: uuid.UUID,
    created_by: uuid.UUID,
) -> InvestigationOut:
    """Create a new investigation.

    Args:
        db: Async database session.
        req: Creation payload.
        org_id: Organisation UUID.
        created_by: User UUID.

    Returns:
        Created InvestigationOut.
    """
    inv = Investigation(
        org_id=org_id,
        title=req.title,
        description=req.description,
        severity=req.severity,
        created_by=created_by,
    )
    db.add(inv)
    await db.flush()

    await write_audit(
        entity_type="investigation",
        action="create",
        entity_id=inv.id,
        actor_id=created_by,
        org_id=org_id,
        db=db,
    )

    logger.info("Created investigation %s by user %s", inv.id, created_by)
    return InvestigationOut.model_validate(inv)


async def list_investigations(
    db: AsyncSession,
    org_id: uuid.UUID,
    page: int = 1,
    page_size: int = 20,
    status_filter: str | None = None,
    severity_filter: str | None = None,
) -> InvestigationListOut:
    """List investigations for an organisation with optional filters.

    Args:
        db: Async database session.
        org_id: Organisation UUID scope.
        page: 1-indexed page number.
        page_size: Items per page (max 100).
        status_filter: Optional status to filter by.
        severity_filter: Optional severity to filter by.

    Returns:
        Paginated InvestigationListOut.
    """
    page_size = min(page_size, 100)
    offset = (page - 1) * page_size

    query = select(Investigation).where(Investigation.org_id == org_id)
    if status_filter:
        query = query.where(Investigation.status == status_filter)
    if severity_filter:
        query = query.where(Investigation.severity == severity_filter)

    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    query = query.order_by(Investigation.created_at.desc()).offset(offset).limit(page_size)
    result = await db.execute(query)
    items = result.scalars().all()

    return InvestigationListOut(
        items=[InvestigationOut.model_validate(i) for i in items],
        total=total,
        page=page,
        page_size=page_size,
    )


async def get_investigation(
    db: AsyncSession, investigation_id: uuid.UUID, org_id: uuid.UUID
) -> InvestigationOut:
    """Fetch a single investigation by ID scoped to org.

    Raises:
        HTTPException 404: Not found.
    """
    result = await db.execute(
        select(Investigation).where(
            Investigation.id == investigation_id, Investigation.org_id == org_id
        )
    )
    inv = result.scalar_one_or_none()
    if not inv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Investigation {investigation_id} not found",
        )
    return InvestigationOut.model_validate(inv)


async def update_investigation(
    db: AsyncSession,
    investigation_id: uuid.UUID,
    org_id: uuid.UUID,
    req: InvestigationUpdate,
    actor_id: uuid.UUID,
) -> InvestigationOut:
    """Partially update an investigation.

    Raises:
        HTTPException 404: Not found.
    """
    result = await db.execute(
        select(Investigation).where(
            Investigation.id == investigation_id, Investigation.org_id == org_id
        )
    )
    inv = result.scalar_one_or_none()
    if not inv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Investigation {investigation_id} not found",
        )

    diff: dict = {}
    if req.title is not None and req.title != inv.title:
        diff["title"] = {"before": inv.title, "after": req.title}
        inv.title = req.title
    if req.description is not None:
        diff["description"] = {"before": inv.description, "after": req.description}
        inv.description = req.description
    if req.severity is not None and req.severity != inv.severity:
        diff["severity"] = {"before": inv.severity, "after": req.severity}
        inv.severity = req.severity
    if req.status is not None and req.status != inv.status:
        diff["status"] = {"before": inv.status, "after": req.status}
        inv.status = req.status
        if req.status == "closed" and inv.closed_at is None:
            inv.closed_at = datetime.now(timezone.utc)

    if diff:
        await write_audit(
            entity_type="investigation",
            action="update",
            entity_id=inv.id,
            actor_id=actor_id,
            org_id=org_id,
            diff=diff,
            db=db,
        )

    await db.flush()
    return InvestigationOut.model_validate(inv)


async def delete_investigation(
    db: AsyncSession,
    investigation_id: uuid.UUID,
    org_id: uuid.UUID,
    actor_id: uuid.UUID,
) -> None:
    """Delete an investigation by ID.

    Raises:
        HTTPException 404: Not found.
    """
    result = await db.execute(
        select(Investigation).where(
            Investigation.id == investigation_id, Investigation.org_id == org_id
        )
    )
    inv = result.scalar_one_or_none()
    if not inv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Investigation {investigation_id} not found",
        )

    await write_audit(
        entity_type="investigation",
        action="delete",
        entity_id=inv.id,
        actor_id=actor_id,
        org_id=org_id,
        db=db,
    )
    await db.delete(inv)
    await db.flush()
    logger.info("Deleted investigation %s", investigation_id)


async def get_timeline(
    db: AsyncSession,
    investigation_id: uuid.UUID,
    org_id: uuid.UUID,
) -> TimelineOut:
    """Retrieve the audit-log-based timeline for an investigation.

    Raises:
        HTTPException 404: Investigation not found.
    """
    # Verify investigation exists in org
    await get_investigation(db, investigation_id, org_id)

    result = await db.execute(
        select(AuditLog)
        .where(AuditLog.entity_id == investigation_id)
        .order_by(AuditLog.timestamp.asc())
    )
    logs = result.scalars().all()

    events = [
        TimelineEvent(
            timestamp=log.timestamp,
            event_type=log.action,
            actor_id=log.actor_id,
            entity_type=log.entity_type,
            description=f"{log.action.capitalize()} {log.entity_type} {log.entity_id}",
        )
        for log in logs
    ]
    return TimelineOut(investigation_id=investigation_id, events=events)


# ── Comments ──────────────────────────────────────────────────────────────────

async def create_comment(
    db: AsyncSession,
    req: CommentCreate,
    org_id: uuid.UUID,
    author_id: uuid.UUID,
) -> CommentOut:
    """Add a comment to any entity."""
    comment = Comment(
        org_id=org_id,
        entity_type=req.entity_type,
        entity_id=req.entity_id,
        content=req.content,
        author_id=author_id,
    )
    db.add(comment)
    await db.flush()
    return CommentOut.model_validate(comment)


async def list_comments(
    db: AsyncSession,
    entity_id: uuid.UUID,
    entity_type: str,
    org_id: uuid.UUID,
) -> list[CommentOut]:
    """List all comments for a given entity."""
    result = await db.execute(
        select(Comment).where(
            Comment.entity_id == entity_id,
            Comment.entity_type == entity_type,
            Comment.org_id == org_id,
        ).order_by(Comment.created_at.asc())
    )
    return [CommentOut.model_validate(c) for c in result.scalars().all()]


# ── Tasks ─────────────────────────────────────────────────────────────────────

async def create_task(
    db: AsyncSession,
    investigation_id: uuid.UUID,
    org_id: uuid.UUID,
    req: TaskCreate,
    actor_id: uuid.UUID,
) -> TaskOut:
    """Create a task linked to an investigation."""
    # Verify investigation exists
    await get_investigation(db, investigation_id, org_id)

    task = Task(
        investigation_id=investigation_id,
        org_id=org_id,
        title=req.title,
        description=req.description,
        assignee_id=req.assignee_id,
        due_date=req.due_date,
    )
    db.add(task)
    await db.flush()
    return TaskOut.model_validate(task)


async def list_tasks(
    db: AsyncSession,
    investigation_id: uuid.UUID,
    org_id: uuid.UUID,
) -> list[TaskOut]:
    """List all tasks for an investigation."""
    result = await db.execute(
        select(Task).where(
            Task.investigation_id == investigation_id,
            Task.org_id == org_id,
        ).order_by(Task.created_at.asc())
    )
    return [TaskOut.model_validate(t) for t in result.scalars().all()]


async def update_task(
    db: AsyncSession,
    task_id: uuid.UUID,
    org_id: uuid.UUID,
    req: TaskUpdate,
    actor_id: uuid.UUID,
) -> TaskOut:
    """Partially update a task."""
    result = await db.execute(
        select(Task).where(Task.id == task_id, Task.org_id == org_id)
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    if req.title is not None:
        task.title = req.title
    if req.description is not None:
        task.description = req.description
    if req.assignee_id is not None:
        task.assignee_id = req.assignee_id
    if req.status is not None:
        task.status = req.status
    if req.due_date is not None:
        task.due_date = req.due_date

    await db.flush()
    return TaskOut.model_validate(task)
