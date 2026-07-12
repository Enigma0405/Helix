import sys
from pathlib import Path

# Ensure backend root is in PYTHONPATH
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from src.shared.config import settings
from src.ingestion.parser_registry import ParserRegistry
from src.ingestion.parsers.pdf_parser import PdfParser
from src.ingestion.parsers.json_parser import JsonParser
from src.ingestion.parsers.csv_parser import CsvParser
from src.organization_memory.storage.storage_adapter import LocalFilesystemAdapter
from src.organization_memory.storage.organization_memory_repository import OrganizationMemoryRepository
from src.ingestion.orchestrator import IngestionOrchestrator
from src.shared.logging import ingestion_logger

def main():
    ingestion_logger.info("Setting up Ingestion Core...")
    
    # 1. Registry Setup
    registry = ParserRegistry()
    registry.register(PdfParser())
    registry.register(JsonParser())
    registry.register(CsvParser())
    ingestion_logger.info("Parsers registered.")
    
    # 2. Storage Setup
    tenant_dir = Path(settings.TENANT_DATA_DIR)
    if not tenant_dir.is_absolute():
        tenant_dir = (backend_dir / tenant_dir).resolve()
        
    adapter = LocalFilesystemAdapter(base_dir=tenant_dir)
    repository = OrganizationMemoryRepository(adapter=adapter)
    ingestion_logger.info(f"Storage adapter configured for {tenant_dir}")
    
    # 3. Orchestrator
    orchestrator = IngestionOrchestrator(repository=repository, registry=registry)
    
    # 4. Run Slice
    tenant_id = "apex_precision"
    ingestion_logger.info(f"Running ingestion for tenant {tenant_id}")
    count = orchestrator.run_ingestion(tenant_id=tenant_id)
    
    ingestion_logger.info(f"Test completed. {count} documents successfully ingested to Canonical JSON.")

if __name__ == "__main__":
    main()
