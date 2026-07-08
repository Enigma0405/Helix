"""Knowledge domain service: document upload, listing, and semantic search."""
from __future__ import annotations

import asyncio
import logging
import uuid

from fastapi import HTTPException, UploadFile, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.config import settings
from src.core.storage import delete_file, generate_storage_key, upload_file
from src.knowledge.models import Chunk, Document, Embedding
from src.knowledge.schemas import (
    DocumentCreate,
    DocumentListOut,
    DocumentOut,
    SearchRequest,
    SearchResponse,
    SearchResult,
)

logger = logging.getLogger(__name__)


async def upload_document(
    db: AsyncSession,
    file: UploadFile,
    req: DocumentCreate,
    org_id: uuid.UUID,
    created_by: uuid.UUID,
) -> DocumentOut:
    """Upload a knowledge document to MinIO and trigger processing.

    Args:
        db: Async database session.
        file: Uploaded file.
        req: Document metadata (title, doc_type).
        org_id: Organisation UUID.
        created_by: User UUID.

    Returns:
        Created DocumentOut.
    """
    original_filename = file.filename or "document"
    mime_type = file.content_type or "application/octet-stream"
    file_bytes = await file.read()

    storage_key = generate_storage_key("documents", original_filename, str(org_id))

    await upload_file(
        bucket=settings.MINIO_BUCKET_DOCUMENTS,
        object_name=storage_key,
        data=file_bytes,
        content_type=mime_type,
        length=len(file_bytes),
    )

    doc = Document(
        org_id=org_id,
        title=req.title,
        storage_key=storage_key,
        doc_type=req.doc_type,
        created_by=created_by,
    )
    db.add(doc)
    await db.flush()

    logger.info("Created document %s (%s) for org %s", doc.id, req.title, org_id)

    # Trigger async processing
    doc_id = doc.id
    asyncio.create_task(_process_document(doc_id, mime_type, original_filename, org_id, file_bytes))

    return DocumentOut.model_validate(doc)


async def _process_document(
    doc_id: uuid.UUID,
    mime_type: str,
    original_filename: str,
    org_id: uuid.UUID,
    file_bytes: bytes,
) -> None:
    """Background task: extract, chunk, embed, and store a knowledge document."""
    from src.core.database import AsyncSessionLocal  # noqa: PLC0415
    from src.evidence.document_adapter import get_adapter  # noqa: PLC0415
    from src.evidence.processor import chunk_text, clean_text, generate_embeddings  # noqa: PLC0415

    async with AsyncSessionLocal() as db:
        try:
            adapter = get_adapter(mime_type, original_filename)
            extracted_text, file_metadata = adapter.extract(file_bytes, original_filename)

            if not extracted_text.strip():
                logger.warning("No text extracted from document %s", doc_id)
                return

            cleaned = clean_text(extracted_text)
            text_chunks = chunk_text(cleaned)
            if not text_chunks:
                return

            vectors = await generate_embeddings(text_chunks)

            model_name = (
                settings.EMBEDDING_MODEL_LOCAL
                if settings.EMBEDDING_PROVIDER == "local"
                else settings.EMBEDDING_MODEL_FIREWORKS
            )

            chunk_objs: list[Chunk] = []
            for idx, content in enumerate(text_chunks):
                chunk = Chunk(
                    source_id=doc_id,
                    source_type="document",
                    org_id=org_id,
                    content=content,
                    chunk_index=idx,
                    metadata_={**file_metadata, "doc_id": str(doc_id), "chunk_index": idx},
                )
                db.add(chunk)
                chunk_objs.append(chunk)

            await db.flush()

            for chunk, vector in zip(chunk_objs, vectors):
                emb = Embedding(
                    chunk_id=chunk.id,
                    vector=vector,
                    model_name=model_name,
                )
                db.add(emb)

            await db.commit()
            logger.info("Processed document %s into %d chunks", doc_id, len(chunk_objs))

        except Exception as exc:
            logger.exception("Document processing failed for %s: %s", doc_id, exc)
            await db.rollback()


async def list_documents(
    db: AsyncSession,
    org_id: uuid.UUID,
    page: int = 1,
    page_size: int = 20,
    doc_type: str | None = None,
) -> DocumentListOut:
    """List knowledge documents with optional type filter."""
    page_size = min(page_size, 100)
    offset = (page - 1) * page_size

    query = select(Document).where(Document.org_id == org_id)
    if doc_type:
        query = query.where(Document.doc_type == doc_type)

    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar_one()

    query = query.order_by(Document.created_at.desc()).offset(offset).limit(page_size)
    result = await db.execute(query)
    items = result.scalars().all()

    return DocumentListOut(
        items=[DocumentOut.model_validate(d) for d in items],
        total=total,
    )


async def get_document(
    db: AsyncSession, doc_id: uuid.UUID, org_id: uuid.UUID
) -> DocumentOut:
    """Get a single knowledge document by ID.

    Raises:
        HTTPException 404: Not found.
    """
    result = await db.execute(
        select(Document).where(Document.id == doc_id, Document.org_id == org_id)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document {doc_id} not found",
        )
    return DocumentOut.model_validate(doc)


async def delete_document(
    db: AsyncSession,
    doc_id: uuid.UUID,
    org_id: uuid.UUID,
    actor_id: uuid.UUID,
) -> None:
    """Delete document from DB and MinIO.

    Raises:
        HTTPException 404: Not found.
    """
    result = await db.execute(
        select(Document).where(Document.id == doc_id, Document.org_id == org_id)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document {doc_id} not found",
        )

    try:
        await delete_file(settings.MINIO_BUCKET_DOCUMENTS, doc.storage_key)
    except Exception as exc:
        logger.warning("MinIO delete failed for doc %s: %s", doc_id, exc)

    await db.delete(doc)
    await db.flush()
    logger.info("Deleted document %s", doc_id)


async def semantic_search(
    db: AsyncSession,
    req: SearchRequest,
    org_id: uuid.UUID,
) -> SearchResponse:
    """Perform pgvector cosine similarity search over chunks.

    Args:
        db: Async database session.
        req: Search parameters (query, top_k, source_types, investigation_id).
        org_id: Organisation scope.

    Returns:
        SearchResponse with ranked results.
    """
    from src.ai_runtime.adapters.embedding_adapter import get_embedding_adapter  # noqa: PLC0415
    from sqlalchemy import text  # noqa: PLC0415

    # Generate query embedding
    adapter = get_embedding_adapter()
    query_vectors = await adapter.embed_batch([req.query])
    query_vector = query_vectors[0]

    # Database dialect check
    is_sqlite = db.bind.dialect.name == "sqlite"

    if is_sqlite:
        import json
        # SQLite fallback: load all chunks and embeddings for the organization,
        # deserialize vectors, and compute similarity in Python.
        stmt = select(Chunk).where(Chunk.org_id == org_id)
        if req.source_types:
            stmt = stmt.where(Chunk.source_type.in_(req.source_types))
        
        result = await db.execute(stmt)
        chunks_db = result.scalars().all()
        
        rows = []
        for chunk in chunks_db:
            # Load the embedding for this chunk
            emb_result = await db.execute(select(Embedding).where(Embedding.chunk_id == chunk.id))
            emb = emb_result.scalar_one_or_none()
            
            score = 0.0
            if emb:
                try:
                    if isinstance(emb.vector, str):
                        vec = json.loads(emb.vector)
                    else:
                        vec = emb.vector
                    
                    if len(vec) == len(query_vector):
                        score = sum(a * b for a, b in zip(vec, query_vector))
                except Exception:
                    pass
            
            rows.append((chunk, score))
        
        # Sort by score descending
        rows.sort(key=lambda x: x[1], reverse=True)
        rows = rows[:req.top_k]
        
        search_results = [
            SearchResult(
                chunk_id=c.id,
                source_id=c.source_id,
                source_type=c.source_type,
                content=c.content,
                score=score,
                metadata=c.metadata_ or {},
            )
            for c, score in rows
        ]
        return SearchResponse(
            query=req.query,
            results=search_results,
            total=len(search_results),
        )

    # Build pgvector cosine similarity query
    # cosine_distance = 1 - cosine_similarity, so lower is better
    # We convert to similarity: 1 - distance
    vector_str = "[" + ",".join(str(v) for v in query_vector) + "]"

    # Build source type filter
    source_type_filter = ""
    if req.source_types:
        types_joined = ", ".join(f"'{t}'" for t in req.source_types)
        source_type_filter = f"AND c.source_type IN ({types_joined})"

    inv_filter = ""
    if req.investigation_id:
        inv_filter = f"AND (c.metadata->>'investigation_id')::uuid = '{req.investigation_id}'"

    raw_sql = text(f"""
        SELECT
            c.id AS chunk_id,
            c.source_id,
            c.source_type,
            c.content,
            c.metadata AS metadata,
            (1 - (e.vector <=> '{vector_str}'::vector)) AS score
        FROM embeddings e
        JOIN chunks c ON c.id = e.chunk_id
        WHERE c.org_id = :org_id
        {source_type_filter}
        {inv_filter}
        ORDER BY e.vector <=> '{vector_str}'::vector
        LIMIT :top_k
    """)

    result = await db.execute(raw_sql, {"org_id": str(org_id), "top_k": req.top_k})
    rows = result.fetchall()

    search_results = [
        SearchResult(
            chunk_id=row.chunk_id,
            source_id=row.source_id,
            source_type=row.source_type,
            content=row.content,
            score=float(row.score),
            metadata=row.metadata,
        )
        for row in rows
    ]

    return SearchResponse(
        query=req.query,
        results=search_results,
        total=len(search_results),
    )
