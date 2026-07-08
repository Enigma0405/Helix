"""Retrieval engine: pgvector cosine similarity search and result reranking.

Provides the retrieval half of the RAG (Retrieval-Augmented Generation)
pipeline used by hypothesis generation and CAPA drafting.
"""
from __future__ import annotations

import logging
import uuid
from dataclasses import dataclass, field

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)


@dataclass
class RetrievedChunk:
    """A single retrieved chunk with similarity score and provenance."""

    chunk_id: uuid.UUID
    source_id: uuid.UUID
    source_type: str  # evidence|document
    content: str
    score: float  # cosine similarity [0, 1]
    metadata: dict = field(default_factory=dict)


class RetrievalEngine:
    """pgvector-powered semantic retrieval engine.

    Performs cosine similarity search over the embeddings table and
    optionally re-ranks results using a simple cross-encoder heuristic.
    """

    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def retrieve(
        self,
        query_vector: list[float],
        org_id: uuid.UUID,
        top_k: int = 10,
        source_types: list[str] | None = None,
        investigation_id: uuid.UUID | None = None,
        min_score: float = 0.0,
    ) -> list[RetrievedChunk]:
        """Retrieve top-k semantically similar chunks using pgvector cosine search.

        Args:
            query_vector: Embedding of the query text.
            org_id: Organisation UUID for multi-tenant isolation.
            top_k: Maximum number of chunks to return.
            source_types: Optional list to filter by source type ('evidence'/'document').
            investigation_id: Optional scope to a single investigation's evidence.
            min_score: Minimum similarity score (0.0 to 1.0) for filtering.

        Returns:
            List of RetrievedChunk ordered by descending similarity score.
        """
        # Database dialect check
        is_sqlite = self._db.bind.dialect.name == "sqlite"

        if is_sqlite:
            # SQLite fallback: load all chunks and embeddings for the organization,
            # deserialize vectors, and compute similarity in Python.
            from sqlalchemy import select
            from src.knowledge.models import Chunk, Embedding
            import json

            # Build query
            stmt = select(Chunk).where(Chunk.org_id == org_id)
            if source_types:
                stmt = stmt.where(Chunk.source_type.in_(source_types))
            
            result = await self._db.execute(stmt)
            chunks_db = result.scalars().all()
            
            rows = []
            for chunk in chunks_db:
                # Load the embedding for this chunk
                emb_result = await self._db.execute(select(Embedding).where(Embedding.chunk_id == chunk.id))
                emb = emb_result.scalar_one_or_none()
                
                score = 0.0
                if emb:
                    try:
                        # Vector is stored as a string representing list or list of floats
                        # depending on the dialect
                        if isinstance(emb.vector, str):
                            vec = json.loads(emb.vector)
                        else:
                            vec = emb.vector
                        
                        # Calculate dot product
                        if len(vec) == len(query_vector):
                            score = sum(a * b for a, b in zip(vec, query_vector))
                    except Exception:
                        pass
                
                rows.append((chunk, score))
            
            # Sort by score descending
            rows.sort(key=lambda x: x[1], reverse=True)
            rows = rows[:top_k]
            
            chunks = [
                RetrievedChunk(
                    chunk_id=c.id,
                    source_id=c.source_id,
                    source_type=c.source_type,
                    content=c.content,
                    score=score,
                    metadata=c.metadata_ or {},
                )
                for c, score in rows
                if score >= min_score
            ]
            return chunks

        vector_str = "[" + ",".join(str(v) for v in query_vector) + "]"

        source_filter = ""
        if source_types:
            types_list = ", ".join(f"'{t}'" for t in source_types)
            source_filter = f"AND c.source_type IN ({types_list})"

        inv_filter = ""
        if investigation_id:
            inv_filter = f"AND (c.metadata->>'investigation_id')::uuid = '{investigation_id}'"

        sql = text(f"""
            SELECT
                c.id        AS chunk_id,
                c.source_id AS source_id,
                c.source_type,
                c.content,
                c.metadata,
                (1 - (e.vector <=> '{vector_str}'::vector)) AS score
            FROM embeddings e
            JOIN chunks c ON c.id = e.chunk_id
            WHERE c.org_id = :org_id
            {source_filter}
            {inv_filter}
            ORDER BY e.vector <=> '{vector_str}'::vector
            LIMIT :top_k
        """)

        result = await self._db.execute(sql, {"org_id": str(org_id), "top_k": top_k})
        rows = result.fetchall()

        chunks = [
            RetrievedChunk(
                chunk_id=row.chunk_id,
                source_id=row.source_id,
                source_type=row.source_type,
                content=row.content,
                score=float(row.score),
                metadata=row.metadata or {},
            )
            for row in rows
            if float(row.score) >= min_score
        ]

        logger.debug(
            "Retrieved %d chunks (org=%s, top_k=%d, min_score=%.2f)",
            len(chunks),
            org_id,
            top_k,
            min_score,
        )
        return chunks

    async def retrieve_for_query(
        self,
        query: str,
        org_id: uuid.UUID,
        top_k: int = 10,
        source_types: list[str] | None = None,
        investigation_id: uuid.UUID | None = None,
        min_score: float = 0.2,
    ) -> list[RetrievedChunk]:
        """Embed a query string and retrieve the top-k relevant chunks.

        This is the convenience method used by workflows — it handles
        embedding generation internally.

        Args:
            query: Natural language query.
            org_id: Organisation UUID.
            top_k: Number of results to return.
            source_types: Optional source type filter.
            investigation_id: Optional investigation scope.
            min_score: Minimum similarity threshold.

        Returns:
            List of RetrievedChunk ordered by relevance.
        """
        from src.ai_runtime.adapters.embedding_adapter import get_embedding_adapter  # noqa: PLC0415

        adapter = get_embedding_adapter()
        vectors = await adapter.embed_batch([query])
        query_vector = vectors[0]

        return await self.retrieve(
            query_vector=query_vector,
            org_id=org_id,
            top_k=top_k,
            source_types=source_types,
            investigation_id=investigation_id,
            min_score=min_score,
        )

    def rerank(
        self,
        chunks: list[RetrievedChunk],
        query: str,
        top_k: int | None = None,
    ) -> list[RetrievedChunk]:
        """Heuristic reranker: boosts chunks that contain query term matches.

        This lightweight reranker supplements vector search with keyword overlap.
        In a production system, this would be replaced with a cross-encoder model.

        Args:
            chunks: Candidate chunks from vector search.
            query: Original query string for keyword matching.
            top_k: Final number to return (defaults to all).

        Returns:
            Re-ranked list of chunks.
        """
        query_terms = set(query.lower().split())

        def _boost_score(chunk: RetrievedChunk) -> float:
            content_lower = chunk.content.lower()
            keyword_hits = sum(1 for term in query_terms if term in content_lower)
            keyword_boost = keyword_hits * 0.02  # +2% per matching term
            return min(chunk.score + keyword_boost, 1.0)

        reranked = sorted(chunks, key=_boost_score, reverse=True)

        if top_k:
            reranked = reranked[:top_k]

        logger.debug("Reranked %d chunks → returning %d", len(chunks), len(reranked))
        return reranked
