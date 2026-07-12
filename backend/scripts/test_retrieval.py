import sys
import asyncio
from pathlib import Path

# Ensure backend root is in PYTHONPATH
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

from src.shared.config import settings
from src.knowledge.embedder import EmbeddingService
from src.knowledge.retriever import DocumentRetriever
from src.shared.logging import knowledge_logger

async def main():
    knowledge_logger.info("Starting Retrieval Test...")
    
    # 1. DB Setup
    engine = create_async_engine(settings.DATABASE_URL)
    AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)
    
    # 2. Components
    embedder = EmbeddingService()
    retriever = DocumentRetriever(embedder=embedder)
    tenant_id = "apex_precision"
    
    queries = [
        "What is the deviation approval workflow?",
        "Who approves CAPA?",
        "Which SOP governs equipment cleaning?",
        "How are suppliers qualified?",
        "What are the parameters for fluid bed drying?"
    ]
    
    async with AsyncSessionLocal() as session:
        for query in queries:
            knowledge_logger.info(f"\n[QUERY] {query}")
            
            chunks = await retriever.retrieve(
                session=session,
                tenant_id=tenant_id,
                query=query,
                top_k=3
            )
            
            for i, chunk in enumerate(chunks):
                # Calculate simple distance by fetching the raw objects
                # Note: To fetch distance directly, you'd select the distance in SQL.
                # Here we just show the rank, doc_id, and snippet.
                snippet = chunk.text[:150].replace('\n', ' ')
                knowledge_logger.info(f"  [Rank {i+1}] Doc: {chunk.doc_id} Context: {chunk.semantic_context}")
                knowledge_logger.info(f"    --> {snippet}...")
                
if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(main())
