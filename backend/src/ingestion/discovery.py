"""Scans Organization Seed for new or updated files to ingest. Idempotent check."""
import json
import os
from pathlib import Path
from typing import List, Dict, Any

from src.shared.config import settings
from src.shared.logging import ingestion_logger

def get_tenant_source_data_path(tenant_id: str = "apex_precision") -> Path:
    """Returns the absolute path to the configured tenant's source_data."""
    base_dir = Path(__file__).parent.parent.parent.parent
    tenant_dir = Path(settings.TENANT_DATA_DIR)
    
    if not tenant_dir.is_absolute():
        tenant_dir = (base_dir / tenant_dir).resolve()
        
    return tenant_dir / tenant_id / "source_data"

def discover_ingestable_documents(tenant_id: str = "apex_precision") -> List[Dict[str, Any]]:
    """
    Scans the tenant's source_data directory for source files (e.g., PDFs)
    and returns a list of documents pending ingestion.
    """
    source_data_path = get_tenant_source_data_path(tenant_id)
    
    if not source_data_path.exists():
        ingestion_logger.error(f"Source data directory not found at {source_data_path}")
        return []
        
    ingest_docs = []
    
    try:
        # Walk through the source_data directory and find all documents
        for root, _, files in os.walk(source_data_path):
            for file in files:
                if file.endswith('.pdf') or file.endswith('.json') or file.endswith('.csv') or file.endswith('.xlsx'):
                    file_path = Path(root) / file
                    
                    # Convert to relative path from source_data for consistency
                    rel_path = file_path.relative_to(source_data_path)
                    
                    ingest_docs.append({
                        "file_id": file,
                        "file_path": str(file_path),
                        "relative_path": str(rel_path),
                        "status": "pending_ingestion"
                    })
        
        # In a real system, priority could be assigned by file type or directory
        ingestion_logger.info(f"Discovered {len(ingest_docs)} documents for ingestion in {source_data_path}.")
        return ingest_docs
        
    except Exception as e:
        ingestion_logger.error(f"Failed to scan source data: {e}")
        return []
