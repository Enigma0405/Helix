"""Evidence processing pipeline: extract → clean → chunk → embed → store.

This module is the core document intelligence pipeline. It runs as a
background task after evidence upload.

Pipeline stages:
1. Download raw bytes from MinIO
2. Select the correct DocumentAdapter for the file type
3. Extract text + metadata using the adapter
4. Clean and normalize text
5. Chunk using LangChain text splitters
6. Generate embeddings for each chunk
7. Persist chunks + embeddings in the database
8. Update EvidenceItem status
"""
from __future__ import annotations

import asyncio
import logging
import re
import uuid
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from src.core.config import settings
from src.core.database import AsyncSessionLocal
from src.core.storage import download_file
from src.evidence.document_adapter import get_adapter
from src.evidence.models import EvidenceItem
from src.knowledge.models import Chunk, Embedding

logger = logging.getLogger(__name__)


# ── Text cleaning ─────────────────────────────────────────────────────────────

def clean_text(raw: str) -> str:
    """Normalize extracted text for chunking.

    - Strip control characters (except newline/tab)
    - Collapse excessive whitespace
    - Remove null bytes

    Args:
        raw: Raw extracted text.

    Returns:
        Cleaned text string.
    """
    # Remove null bytes
    text = raw.replace("\x00", "")
    # Remove non-printable control chars except \n, \r, \t
    text = re.sub(r"[^\S\n\r\t ]+", " ", text)
    # Collapse 3+ consecutive newlines to 2
    text = re.sub(r"\n{3,}", "\n\n", text)
    # Strip leading/trailing whitespace on each line
    lines = [line.rstrip() for line in text.splitlines()]
    return "\n".join(lines).strip()


# ── Chunking ──────────────────────────────────────────────────────────────────

def chunk_text(text: str) -> list[str]:
    """Split text into overlapping chunks using LangChain splitters.

    Args:
        text: Cleaned document text.

    Returns:
        List of text chunk strings.
    """
    from langchain_text_splitters import RecursiveCharacterTextSplitter  # noqa: PLC0415

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.CHUNK_SIZE,
        chunk_overlap=settings.CHUNK_OVERLAP,
        separators=["\n\n", "\n", ". ", " ", ""],
        length_function=len,
    )
    chunks = splitter.split_text(text)
    logger.debug("Chunked text into %d chunks (size=%d)", len(chunks), settings.CHUNK_SIZE)
    return chunks


# ── Embedding ─────────────────────────────────────────────────────────────────

async def generate_embeddings(texts: list[str]) -> list[list[float]]:
    """Generate vector embeddings for a list of text chunks.

    Uses the configured embedding provider (local sentence-transformers or Fireworks).

    Args:
        texts: List of text strings to embed.

    Returns:
        List of float vectors, one per input text.
    """
    from src.ai_runtime.adapters.embedding_adapter import get_embedding_adapter  # noqa: PLC0415

    adapter = get_embedding_adapter()
    return await adapter.embed_batch(texts)


# ── Main processing pipeline ──────────────────────────────────────────────────

async def process_evidence_item(evidence_id: uuid.UUID) -> None:
    """Run the full processing pipeline for one EvidenceItem.

    Opens its own database session to avoid coupling to the request lifecycle.

    Args:
        evidence_id: UUID of the EvidenceItem to process.
    """
    async with AsyncSessionLocal() as db:
        await _run_pipeline(db, evidence_id)


async def _run_pipeline(db: AsyncSession, evidence_id: uuid.UUID) -> None:
    """Internal pipeline implementation.

    Args:
        db: Database session.
        evidence_id: UUID of the EvidenceItem to process.
    """
    from sqlalchemy import select  # noqa: PLC0415

    # 1. Load evidence item
    result = await db.execute(
        select(EvidenceItem).where(EvidenceItem.id == evidence_id)
    )
    evidence = result.scalar_one_or_none()
    if not evidence:
        logger.error("EvidenceItem %s not found — aborting pipeline", evidence_id)
        return

    # Mark as processing
    evidence.status = "processing"
    await db.commit()

    try:
        # 2. Download from MinIO
        logger.info("Downloading evidence %s from storage", evidence_id)
        raw_bytes = await download_file(
            settings.MINIO_BUCKET_EVIDENCE, evidence.storage_key
        )

        # 3. Select adapter and extract text
        adapter = get_adapter(evidence.mime_type, evidence.original_filename)
        logger.info("Using adapter %s for %s", adapter.__class__.__name__, evidence.original_filename)
        extracted_text, file_metadata = adapter.extract(raw_bytes, evidence.original_filename)

        # Update page count if available
        if "page_count" in file_metadata:
            evidence.page_count = file_metadata["page_count"]

        if not extracted_text.strip():
            logger.warning("No text extracted from evidence %s", evidence_id)
            evidence.status = "processed"
            evidence.page_count = file_metadata.get("page_count", 0)
            await db.commit()
            return

        # 4. Clean text
        cleaned = clean_text(extracted_text)

        # 5. Chunk text
        text_chunks = chunk_text(cleaned)
        if not text_chunks:
            logger.warning("No chunks produced from evidence %s", evidence_id)
            evidence.status = "processed"
            await db.commit()
            return

        # 6. Generate embeddings
        logger.info("Generating embeddings for %d chunks", len(text_chunks))
        vectors = await generate_embeddings(text_chunks)

        # 7. Persist chunks + embeddings
        model_name = (
            settings.EMBEDDING_MODEL_LOCAL
            if settings.EMBEDDING_PROVIDER == "local"
            else settings.EMBEDDING_MODEL_FIREWORKS
        )

        chunk_objs: list[Chunk] = []
        for idx, (chunk_text_content, vector) in enumerate(zip(text_chunks, vectors)):
            chunk = Chunk(
                source_id=evidence.id,
                source_type="evidence",
                org_id=evidence.org_id,
                content=chunk_text_content,
                chunk_index=idx,
                metadata_={
                    **file_metadata,
                    "investigation_id": str(evidence.investigation_id),
                    "evidence_id": str(evidence.id),
                    "chunk_index": idx,
                },
            )
            db.add(chunk)
            chunk_objs.append(chunk)

        await db.flush()  # Assign IDs to chunks

        for chunk, vector in zip(chunk_objs, vectors):
            emb = Embedding(
                chunk_id=chunk.id,
                vector=vector,
                model_name=model_name,
            )
            db.add(emb)

        # 8. Mark as processed
        evidence.status = "processed"
        await db.commit()

        logger.info(
            "Processed evidence %s: %d chunks, %d embeddings",
            evidence_id,
            len(chunk_objs),
            len(chunk_objs),
        )

    except Exception as exc:
        logger.exception("Pipeline failed for evidence %s: %s", evidence_id, exc)
        evidence.status = "failed"
        evidence.error_message = str(exc)
        await db.commit()
