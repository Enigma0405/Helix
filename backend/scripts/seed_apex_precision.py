import sys
import asyncio
from pathlib import Path
import json

# Ensure backend root is in PYTHONPATH
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy import select, delete

from src.shared.config import settings
from src.shared.logging import knowledge_logger, ingestion_logger
from src.auth.models import Organization, User
from src.investigation.models import Investigation
from src.shared.security import hash_password as get_password_hash

# Ingestion imports
from src.ingestion.parser_registry import ParserRegistry
from src.ingestion.parsers.pdf_parser import PdfParser
from src.ingestion.parsers.json_parser import JsonParser
from src.ingestion.parsers.csv_parser import CsvParser
from src.organization_memory.storage.storage_adapter import LocalFilesystemAdapter
from src.organization_memory.storage.organization_memory_repository import OrganizationMemoryRepository
from src.ingestion.orchestrator import IngestionOrchestrator

# Knowledge imports
from src.organization_memory.models.canonical_document import CanonicalDocument
from src.knowledge.chunker import DocumentChunker
from src.knowledge.embedder import EmbeddingService
from src.knowledge.vector_store import DocumentChunkEmbedding

async def main():
    print("=======================================")
    print("SEEDING APEX PRECISION ENVIRONMENT")
    print("=======================================\n")

    # 1. Database Setup
    engine = create_async_engine(settings.DATABASE_URL)
    AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

    async with AsyncSessionLocal() as session:
        # Check Organization
        stmt = select(Organization).where(Organization.slug == "apex_precision")
        res = await session.execute(stmt)
        org = res.scalar_one_or_none()

        if not org:
            print("Creating organization: apex_precision")
            org = Organization(name="Apex Precision", slug="apex_precision")
            session.add(org)
            await session.commit()
            await session.refresh(org)
        else:
            print("✓ Organization 'apex_precision' exists")

        # Check User
        stmt_user = select(User).where(User.email == "demo@apexprecision.com")
        res_user = await session.execute(stmt_user)
        user = res_user.scalar_one_or_none()

        if not user:
            print("Creating demo user: demo@apexprecision.com")
            user = User(
                email="demo@apexprecision.com",
                hashed_password=get_password_hash("demo123"),
                full_name="Demo User",
                role="admin",
                org_id=org.id
            )
            session.add(user)
            await session.commit()
            await session.refresh(user)
        else:
            print("✓ Demo user exists")

    # 2. Ingestion Pipeline
    print("\n[1/3] Running Ingestion Pipeline...")
    registry = ParserRegistry()
    registry.register(PdfParser())
    registry.register(JsonParser())
    registry.register(CsvParser())
    
    tenant_dir = Path(settings.TENANT_DATA_DIR)
    if not tenant_dir.is_absolute():
        tenant_dir = (backend_dir / tenant_dir).resolve()
        
    adapter = LocalFilesystemAdapter(base_dir=tenant_dir)
    repository = OrganizationMemoryRepository(adapter=adapter)
    orchestrator = IngestionOrchestrator(repository=repository, registry=registry)
    
    tenant_slug = "apex_precision"
    count = orchestrator.run_ingestion(tenant_id=tenant_slug)
    print(f"✓ {count} Documents Ingested")

    # 3. Knowledge/Embeddings Pipeline
    print("\n[2/3] Generating Embeddings...")
    chunker = DocumentChunker()
    embedder = EmbeddingService()
    
    canonical_dir = tenant_dir / tenant_slug / "organization_memory" / "canonical"
    if not canonical_dir.exists():
        print(f"Error: Canonical directory not found: {canonical_dir}")
        return
        
    json_files = list(canonical_dir.glob("*.json"))
    
    total_chunks = 0
    all_chunks = []
    for jf in json_files:
        with open(jf, 'r', encoding='utf-8') as f:
            data = json.load(f)
            doc = CanonicalDocument(**data)
            chunks = chunker.chunk(doc)
            all_chunks.extend(chunks)
            total_chunks += len(chunks)
            
    print(f"✓ Generated {total_chunks} CanonicalChunks")

    async with AsyncSessionLocal() as session:
        print("Saving embeddings to database...")
        # Clean existing chunks for this tenant
        await session.execute(delete(DocumentChunkEmbedding).where(DocumentChunkEmbedding.tenant_id == tenant_slug))
        
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
                    tenant_id=tenant_slug,
                    text=chunk.text,
                    semantic_context=chunk.semantic_context,
                    embedding=emb
                )
                db_chunks.append(db_chunk)
                
            session.add_all(db_chunks)
            await session.commit()
    print("✓ Embeddings Loaded")

    # 4. Create Demo Investigation
    print("\n[3/3] Creating Demo Investigation...")
    async with AsyncSessionLocal() as session:
        # Check if one already exists
        stmt = select(Investigation).where(Investigation.org_id == org.id).where(Investigation.status == "open")
        res = await session.execute(stmt)
        existing = res.scalars().all()
        
        if not existing:
            demo_inv = Investigation(
                org_id=org.id,
                title="Temperature Excursion in Lyophilizer LY-400",
                description="During Batch 14B-09, temperature probe T-402 on Lyophilizer LY-400 dropped 3 degrees below acceptable range. Need to determine root cause and assess impact on batch quality.",
                severity="high",
                status="open",
                created_by=user.id
            )
            session.add(demo_inv)
            await session.commit()
            print("✓ Demo Investigation Created")
        else:
            print("✓ Demo Investigation already exists")

    print("\n=======================================")
    print("✓ Apex Precision Ready")
    print(f"✓ {count} Documents")
    print(f"✓ {total_chunks} Chunks")
    print("✓ Embeddings Loaded")
    print("✓ Demo Investigation Ready")
    print("=======================================\n")

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(main())
