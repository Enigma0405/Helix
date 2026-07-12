import sys
import asyncio
from pathlib import Path
import json

# Ensure backend root is in PYTHONPATH
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy import select, func

from src.shared.config import settings
from src.organization_memory.models.canonical_document import CanonicalDocument
from src.knowledge.chunker import DocumentChunker
from src.knowledge.embedder import EmbeddingService
from src.knowledge.vector_store import DocumentChunkEmbedding
from src.shared.logging import knowledge_logger

async def main():
    knowledge_logger.info("Starting Embeddings Test & DB Seeding...")
    
    # 1. DB Setup
    engine = create_async_engine(settings.DATABASE_URL)
    AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)
    
    # 2. Component Setup
    chunker = DocumentChunker()
    embedder = EmbeddingService()
    
    # 3. Load Canonical Documents
    tenant_id = "apex_precision"
    canonical_dir = backend_dir / ".." / "organizations" / tenant_id / "organization_memory" / "canonical"
    canonical_dir = canonical_dir.resolve()
    
    if not canonical_dir.exists():
        knowledge_logger.error(f"Canonical directory not found: {canonical_dir}")
        return
        
    json_files = list(canonical_dir.glob("*.json"))
    knowledge_logger.info(f"Found {len(json_files)} canonical documents.")
    
    total_chunks = 0
    all_chunks = []
    
    for jf in json_files:
        with open(jf, 'r', encoding='utf-8') as f:
            data = json.load(f)
            doc = CanonicalDocument(**data)
            
            chunks = chunker.chunk(doc)
            all_chunks.extend(chunks)
            total_chunks += len(chunks)
            
    knowledge_logger.info(f"Generated {total_chunks} CanonicalChunks.")
    
    # 4. Embed & Save
    async with AsyncSessionLocal() as session:
        # Clear existing for test determinism
        await session.execute(DocumentChunkEmbedding.__table__.delete().where(DocumentChunkEmbedding.tenant_id == tenant_id))
        
        batch_size = 50
        for i in range(0, len(all_chunks), batch_size):
            batch = all_chunks[i:i+batch_size]
            texts = [c.text for c in batch]
            embeddings = embedder.embed_texts(texts)
            
            db_chunks = []
            for chunk, emb in zip(batch, embeddings):
                db_chunk = DocumentChunkEmbedding(
                    chunk_id=chunk.chunk_id,
                    doc_id=chunk.doc_id,
                    tenant_id=tenant_id,
                    text=chunk.text,
                    semantic_context=chunk.semantic_context,
                    embedding=emb
                )
                db_chunks.append(db_chunk)
                
            session.add_all(db_chunks)
            await session.commit()
            knowledge_logger.info(f"Saved chunks {i} to {i+len(batch)}")
            
    # 5. Verification
    async with AsyncSessionLocal() as session:
        count_stmt = select(func.count(DocumentChunkEmbedding.chunk_id)).where(DocumentChunkEmbedding.tenant_id == tenant_id)
        count_res = await session.execute(count_stmt)
        db_count = count_res.scalar()
        
        avg_len_stmt = select(func.avg(func.length(DocumentChunkEmbedding.text))).where(DocumentChunkEmbedding.tenant_id == tenant_id)
        avg_len_res = await session.execute(avg_len_stmt)
        avg_len = avg_len_res.scalar()
        
        knowledge_logger.info("=== EMBEDDINGS VERIFICATION ===")
        knowledge_logger.info(f"Expected Chunks: {total_chunks}")
        knowledge_logger.info(f"Vectors in DB: {db_count}")
        knowledge_logger.info(f"Average Chunk Length: {avg_len:.2f} chars")
        knowledge_logger.info(f"Embedding Dimensions: {settings.EMBEDDING_DIM}")
        knowledge_logger.info("Test completed successfully.")

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(main())
