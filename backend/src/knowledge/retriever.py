from typing import List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.knowledge.vector_store import DocumentChunkEmbedding
from src.knowledge.embedder import EmbeddingService

class DocumentRetriever:
    """
    Retrieves the most semantically relevant canonical chunks for a given query.
    """
    
    def __init__(self, embedder: EmbeddingService):
        self.embedder = embedder
        
    async def retrieve(
        self, 
        session: AsyncSession, 
        tenant_id: str, 
        query: str, 
        top_k: int = 5
    ) -> List[DocumentChunkEmbedding]:
        """
        Executes a similarity search against the pgvector index.
        """
        # Embed the query
        query_vector = self.embedder.embed_text(query)
        
        # Execute pgvector cosine similarity search
        stmt = (
            select(DocumentChunkEmbedding)
            .filter(DocumentChunkEmbedding.tenant_id == tenant_id)
            .order_by(DocumentChunkEmbedding.embedding.cosine_distance(query_vector))
            .limit(top_k)
        )
        
        result = await session.execute(stmt)
        chunks = result.scalars().all()
        
        return list(chunks)
