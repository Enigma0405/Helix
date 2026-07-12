import sys
import asyncio
import os
import json
from pathlib import Path

# Ensure backend root is in PYTHONPATH
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

from src.shared.config import settings
from src.knowledge.embedder import EmbeddingService
from src.knowledge.retriever import DocumentRetriever
from src.runtime.intelligence_service import IntelligenceService
from src.shared.logging import application_logger

# We import the adapters
from src.runtime.llm.mock_adapter import MockAdapter
from src.runtime.llm.fireworks_adapter import FireworksAdapter

async def main():
    application_logger.info("Starting Phase 3.3 Acceptance Test: Intelligence Layer")
    
    # Setup dependencies
    engine = create_async_engine(settings.DATABASE_URL)
    AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)
    
    embedder = EmbeddingService()
    retriever = DocumentRetriever(embedder=embedder)
    
    # Configure Inference Adapter Strategy
    # Priority: 1. Fireworks, 2. Mock
    if os.getenv("FIREWORKS_API_KEY") and False: # Force mock for deterministic local test if needed, but let's use Mock by default if key is absent
        pass
    
    adapter = None
    if os.getenv("FIREWORKS_API_KEY"):
        application_logger.info("Using FireworksAdapter")
        adapter = FireworksAdapter()
        # Ensure it actually loaded openai
        if not adapter.client:
            application_logger.warning("Falling back to MockAdapter due to missing openai package.")
            adapter = MockAdapter()
    else:
        application_logger.info("No FIREWORKS_API_KEY found. Falling back to MockAdapter.")
        adapter = MockAdapter()

    service = IntelligenceService(retriever=retriever, inference_adapter=adapter)
    
    tenant_id = "apex_precision"
    question = "What is the deviation approval workflow?"
    
    async with AsyncSessionLocal() as session:
        application_logger.info(f"Query: {question}")
        assessment = await service.run_investigation(session, tenant_id, question)
        
        print("\n" + "="*50)
        print("INVESTIGATION ASSESSMENT")
        print("="*50)
        print(f"\n[SUMMARY]\n{assessment.summary}\n")
        
        print(f"[CONFIDENCE: {assessment.confidence.level}]")
        print(f"Score: {assessment.confidence.score:.2f}")
        print(f"Explanation: {assessment.confidence.explanation}\n")
        
        print("[EVIDENCE USED]")
        for e in assessment.evidence:
            print(f" * {e.document_id} | {e.title} (Chunk: {e.chunk_id})")
        
        print("\n[MISSING EVIDENCE]")
        if assessment.missing_evidence:
            for m in assessment.missing_evidence:
                print(f" - {m}")
        else:
            print(" None detected deterministically.")
            
        print("\n[CONTRADICTIONS]")
        if assessment.contradictions:
            for c in assessment.contradictions:
                print(f" ! {c.description}")
        else:
            print(" None detected deterministically.")
            
        print("\n[NEXT ACTIONS]")
        for na in assessment.next_actions:
            print(f" -> {na}")
            
        print("="*50 + "\n")
        application_logger.info(f"Test completed successfully. Trace ID: {assessment.reasoning_trace_id}")

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(main())
