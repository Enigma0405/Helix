"""Audit logging: AuditLog model, write_audit helper, and audit middleware."""
from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone

from sqlalchemy import TIMESTAMP, ForeignKey, String, Text, JSON
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Mapped, mapped_column

from src.core.database import Base, AsyncSessionLocal

logger = logging.getLogger(__name__)


class AuditLog(Base):
    """Immutable audit trail for all significant actions in the platform."""

    __tablename__ = "audit_logs"

    id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    org_id: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="SET NULL"),
        index=True,
        nullable=True,
    )
    entity_type: Mapped[str] = mapped_column(String(100))
    entity_id: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), nullable=True
    )
    action: Mapped[str] = mapped_column(String(50))
    actor_id: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    diff: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    request_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    timestamp: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        index=True,
    )


async def write_audit(
    *,
    entity_type: str,
    action: str,
    entity_id: uuid.UUID | None = None,
    actor_id: uuid.UUID | None = None,
    org_id: uuid.UUID | None = None,
    diff: dict | None = None,
    request_path: str | None = None,
    db: AsyncSession | None = None,
) -> None:
    """Write an audit log entry.

    Opens a fresh session if ``db`` is not provided so this function can be
    called from middleware where the request session may already be closed.

    Args:
        entity_type: Type of the audited entity (e.g. 'investigation').
        action: Action performed (create|update|delete|approve|reject|export|login).
        entity_id: UUID of the affected entity.
        actor_id: UUID of the user performing the action.
        org_id: UUID of the organisation.
        diff: Optional before/after diff dict.
        request_path: HTTP request path.
        db: Optional existing AsyncSession; if None, a new session is created.
    """
    from src.core.config import settings  # noqa: PLC0415

    if not settings.AUDIT_ENABLED:
        return

    log_entry = AuditLog(
        entity_type=entity_type,
        action=action,
        entity_id=entity_id,
        actor_id=actor_id,
        org_id=org_id,
        diff=diff,
        request_path=request_path,
    )

    if db is not None:
        db.add(log_entry)
        # Do not flush/commit — caller manages transaction
    else:
        async with AsyncSessionLocal() as session:
            session.add(log_entry)
            try:
                await session.commit()
            except Exception as exc:
                logger.error("Failed to write audit log: %s", exc)
                await session.rollback()


# Alias for compatibility across domains
write_audit_log = write_audit

