"""Evidence domain service layer: upload, list, get, delete evidence items."""
from __future__ import annotations

import asyncio
import logging
import uuid

from fastapi import HTTPException, UploadFile, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.audit import write_audit
from src.core.config import settings
from src.core.storage import delete_file, generate_storage_key, upload_file
from src.evidence.models import EvidenceItem
from src.evidence.schemas import EvidenceListOut, EvidenceUploadOut

logger = logging.getLogger(__name__)

# MIME types allowed for upload
ALLOWED_MIME_TYPES: set[str] = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
    "text/csv",
    "application/csv",
    "text/plain",
    "message/rfc822",
    "image/png",
    "image/jpeg",
    "image/tiff",
}

MAX_FILE_SIZE_BYTES: int = 100 * 1024 * 1024  # 100 MB


async def upload_evidence(
    db: AsyncSession,
    file: UploadFile,
    investigation_id: uuid.UUID,
    org_id: uuid.UUID,
    uploaded_by: uuid.UUID,
) -> EvidenceUploadOut:
    """Upload an evidence file to MinIO and create an EvidenceItem record.

    Triggers background processing after successful upload.

    Args:
        db: Async database session.
        file: FastAPI UploadFile from multipart form.
        investigation_id: UUID of the parent investigation.
        org_id: Organisation UUID for multi-tenancy.
        uploaded_by: UUID of the uploading user.

    Returns:
        EvidenceUploadOut schema.

    Raises:
        HTTPException 400: File too large or unsupported MIME type.
        HTTPException 404: Investigation not found.
    """
    from src.investigation.models import Investigation  # noqa: PLC0415

    # Verify investigation belongs to org
    inv_result = await db.execute(
        select(Investigation).where(
            Investigation.id == investigation_id,
            Investigation.org_id == org_id,
        )
    )
    if not inv_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Investigation {investigation_id} not found in your organisation",
        )

    # Validate content type
    mime_type = file.content_type or "application/octet-stream"
    original_filename = file.filename or "unknown"

    # Read file bytes
    file_bytes = await file.read()
    file_size = len(file_bytes)

    if file_size > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum size of {MAX_FILE_SIZE_BYTES // (1024*1024)} MB",
        )

    # Generate storage key
    storage_key = generate_storage_key("evidence", original_filename, str(org_id))

    # Upload to MinIO
    await upload_file(
        bucket=settings.MINIO_BUCKET_EVIDENCE,
        object_name=storage_key,
        data=file_bytes,
        content_type=mime_type,
        length=file_size,
    )

    # Create DB record
    evidence = EvidenceItem(
        investigation_id=investigation_id,
        org_id=org_id,
        filename=storage_key.split("/")[-1],
        original_filename=original_filename,
        storage_key=storage_key,
        mime_type=mime_type,
        file_size_bytes=file_size,
        status="uploaded",
        uploaded_by=uploaded_by,
    )
    db.add(evidence)
    await db.flush()

    await write_audit(
        entity_type="evidence",
        action="create",
        entity_id=evidence.id,
        actor_id=uploaded_by,
        org_id=org_id,
        db=db,
    )

    logger.info(
        "Evidence %s uploaded: %s (%d bytes) for investigation %s",
        evidence.id,
        original_filename,
        file_size,
        investigation_id,
    )

    # Trigger async processing without blocking the response
    evidence_id = evidence.id
    asyncio.create_task(_trigger_processing(evidence_id))

    return EvidenceUploadOut.model_validate(evidence)


async def _trigger_processing(evidence_id: uuid.UUID) -> None:
    """Trigger background evidence processing."""
    try:
        from src.evidence.processor import process_evidence_item  # noqa: PLC0415
        await process_evidence_item(evidence_id)
    except Exception as exc:
        logger.error("Background processing failed for evidence %s: %s", evidence_id, exc)


async def list_evidence(
    db: AsyncSession,
    investigation_id: uuid.UUID,
    org_id: uuid.UUID,
) -> EvidenceListOut:
    """List all evidence items for an investigation.

    Args:
        db: Async database session.
        investigation_id: Investigation UUID.
        org_id: Organisation UUID scope.

    Returns:
        EvidenceListOut with items and total count.
    """
    query = select(EvidenceItem).where(
        EvidenceItem.investigation_id == investigation_id,
        EvidenceItem.org_id == org_id,
    ).order_by(EvidenceItem.created_at.desc())

    result = await db.execute(query)
    items = result.scalars().all()

    count_result = await db.execute(
        select(func.count()).select_from(query.subquery())
    )
    total = count_result.scalar_one()

    return EvidenceListOut(
        items=[EvidenceUploadOut.model_validate(e) for e in items],
        total=total,
    )


async def get_evidence(
    db: AsyncSession,
    evidence_id: uuid.UUID,
    org_id: uuid.UUID,
) -> EvidenceUploadOut:
    """Get a single evidence item by ID.

    Raises:
        HTTPException 404: Not found.
    """
    result = await db.execute(
        select(EvidenceItem).where(
            EvidenceItem.id == evidence_id,
            EvidenceItem.org_id == org_id,
        )
    )
    evidence = result.scalar_one_or_none()
    if not evidence:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Evidence {evidence_id} not found",
        )
    return EvidenceUploadOut.model_validate(evidence)


async def delete_evidence(
    db: AsyncSession,
    evidence_id: uuid.UUID,
    org_id: uuid.UUID,
    actor_id: uuid.UUID,
) -> None:
    """Delete an evidence item and remove from MinIO.

    Raises:
        HTTPException 404: Not found.
    """
    result = await db.execute(
        select(EvidenceItem).where(
            EvidenceItem.id == evidence_id,
            EvidenceItem.org_id == org_id,
        )
    )
    evidence = result.scalar_one_or_none()
    if not evidence:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Evidence {evidence_id} not found",
        )

    # Delete from MinIO
    try:
        await delete_file(settings.MINIO_BUCKET_EVIDENCE, evidence.storage_key)
    except Exception as exc:
        logger.warning("MinIO delete failed for %s: %s", evidence.storage_key, exc)

    await write_audit(
        entity_type="evidence",
        action="delete",
        entity_id=evidence.id,
        actor_id=actor_id,
        org_id=org_id,
        db=db,
    )

    await db.delete(evidence)
    await db.flush()
    logger.info("Deleted evidence %s", evidence_id)


async def get_evidence_chunks(
    db: AsyncSession,
    evidence_id: uuid.UUID,
    org_id: uuid.UUID,
) -> list[Chunk]:
    """Retrieve all semantic chunks generated for an evidence item."""
    from src.knowledge.models import Chunk  # noqa: PLC0415
    stmt = select(Chunk).where(
        Chunk.source_id == evidence_id,
        Chunk.org_id == org_id,
    ).order_by(Chunk.chunk_index.asc())
    res = await db.execute(stmt)
    return list(res.scalars().all())
