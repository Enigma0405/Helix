"""Knowledge domain models: Document, Chunk, Embedding (pgvector)."""
from __future__ import annotations

import uuid
from datetime import datetime

from pgvector.sqlalchemy import Vector
from sqlalchemy import ForeignKey, Integer, String, Text, func, JSON
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.ext.compiler import compiles

from src.shared.config import settings
from src.database.core import Base


@compiles(Vector, "sqlite")
def compile_vector_sqlite(element, compiler, **kw):
    return f"TEXT"



class Document(Base):
    """A knowledge-base document (SOP, manual, CAPA template, etc.)."""

    __tablename__ = "documents"

    id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    org_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    storage_key: Mapped[str] = mapped_column(String(1000), nullable=False)
    doc_type: Mapped[str] = mapped_column(
        String(50), default="general", nullable=False
    )  # capa|sop|manual|general
    created_by: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    chunks: Mapped[list[Chunk]] = relationship(
        "Chunk",
        primaryjoin="and_(Chunk.source_type=='document', foreign(Chunk.source_id)==Document.id)",
        lazy="select",
        viewonly=True,
    )


class Chunk(Base):
    """A text chunk derived from either an evidence file or a knowledge document."""

    __tablename__ = "chunks"

    id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    source_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), index=True, nullable=False
    )
    source_type: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # evidence|document
    org_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    metadata_: Mapped[dict | None] = mapped_column(
        "metadata", JSON, nullable=True, default=dict
    )
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    embedding: Mapped[Embedding | None] = relationship(
        "Embedding", back_populates="chunk", uselist=False, lazy="select"
    )


class Embedding(Base):
    """pgvector embedding for a chunk, used for semantic similarity search."""

    __tablename__ = "embeddings"

    id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    chunk_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("chunks.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    vector: Mapped[list] = mapped_column(Vector(settings.EMBEDDING_DIM), nullable=False)
    model_name: Mapped[str] = mapped_column(String(100), nullable=False)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    chunk: Mapped[Chunk] = relationship("Chunk", back_populates="embedding")


class Equipment(Base):
    """Canonical Equipment entity derived from the Knowledge Graph."""
    __tablename__ = "equipment"

    id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), index=True, nullable=False)
    entity_id: Mapped[str] = mapped_column(String(100), nullable=False) # e.g. EQ-FIL-008
    name: Mapped[str] = mapped_column(String(500), nullable=False)
    type: Mapped[str] = mapped_column(String(100), nullable=False)
    manufacturer: Mapped[str] = mapped_column(String(100), nullable=True)
    calibration_due: Mapped[datetime | None] = mapped_column(nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="Active")
    department: Mapped[str] = mapped_column(String(100), nullable=True)


class SOP(Base):
    """Canonical SOP entity derived from the Knowledge Graph."""
    __tablename__ = "sops"

    id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), index=True, nullable=False)
    entity_id: Mapped[str] = mapped_column(String(100), nullable=False) # e.g. SOP-STER-014
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    version: Mapped[str] = mapped_column(String(50), nullable=False)
    effective_date: Mapped[datetime | None] = mapped_column(nullable=True)
    department: Mapped[str] = mapped_column(String(100), nullable=True)
    thresholds: Mapped[list[dict] | None] = mapped_column(JSON, nullable=True)


class KnowledgeRelationship(Base):
    """Relationships mapped between canonical entities in the Organization Memory."""
    __tablename__ = "knowledge_relationships"

    id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), index=True, nullable=False)
    source_entity: Mapped[str] = mapped_column(String(100), nullable=False) # e.g. SOP-STER-014
    relationship: Mapped[str] = mapped_column(String(100), nullable=False) # e.g. governs
    target_entity: Mapped[str] = mapped_column(String(100), nullable=False) # e.g. EQ-FIL-008
    confidence: Mapped[float] = mapped_column(nullable=False, default=1.0)
    origin_document: Mapped[str | None] = mapped_column(String(500), nullable=True)
    section: Mapped[str | None] = mapped_column(String(500), nullable=True)
