import os
from typing import List
from pathlib import Path
import mimetypes

from src.ingestion.models.context import IngestionContext
from src.ingestion.parser_registry import ParserRegistry
from src.organization_memory.storage.organization_memory_repository import OrganizationMemoryRepository
from src.ingestion.discovery import discover_ingestable_documents
from src.shared.logging import ingestion_logger
from datetime import datetime

class IngestionOrchestrator:
    """
    Coordinates the ingestion pipeline end-to-end.
    """
    def __init__(self, repository: OrganizationMemoryRepository, registry: ParserRegistry):
        self.repository = repository
        self.registry = registry
        
    def _guess_mime_type(self, file_path: str) -> str:
        mime_type, _ = mimetypes.guess_type(file_path)
        return mime_type or "application/octet-stream"
        
    def run_ingestion(self, tenant_id: str, ingestion_id: str = None) -> int:
        """
        Runs the full ingestion slice for a tenant.
        Returns the number of documents successfully canonicalized.
        """
        if not ingestion_id:
            ingestion_id = f"run_{int(datetime.utcnow().timestamp())}"
            
        ingestion_logger.info(f"Starting ingestion run {ingestion_id} for tenant {tenant_id}")
        
        # 1. Discover
        pending_docs = discover_ingestable_documents(tenant_id)
        if not pending_docs:
            ingestion_logger.info("No documents found for ingestion.")
            return 0
            
        success_count = 0
            
        for doc_info in pending_docs:
            file_path = Path(doc_info["file_path"])
            content_type = self._guess_mime_type(str(file_path))
            
            try:
                # 2. Get Parser
                parser = self.registry.get_parser(content_type)
                
                # 3. Context
                context = IngestionContext(
                    tenant_id=tenant_id,
                    ingestion_id=ingestion_id,
                    source_path=file_path,
                    content_type=content_type,
                    parser_version="1.0.0"
                )
                
                # 4. Parse -> CanonicalDocument
                canonical_doc = parser.parse(context)
                
                # 5. Save -> JSON on disk
                self.repository.save_document(tenant_id, canonical_doc)
                
                success_count += 1
                ingestion_logger.info(f"Successfully canonicalized {file_path.name} -> {canonical_doc.doc_id}")
                
            except ValueError as ve:
                ingestion_logger.warning(f"Skipping {file_path.name}: {ve}")
            except Exception as e:
                ingestion_logger.error(f"Failed to process {file_path.name}: {e}")
                
        ingestion_logger.info(f"Ingestion run {ingestion_id} complete. Canonicalized {success_count} documents.")
        return success_count

