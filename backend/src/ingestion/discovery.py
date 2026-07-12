"""Scans Organization Seed for new or updated files to ingest. Idempotent check."""
import json
import os
from pathlib import Path
from typing import List, Dict, Any

from src.shared.config import settings
from src.shared.logging import ingestion_logger

def get_tenant_manifest_path(tenant_id: str = "apex_precision") -> Path:
    """Returns the absolute path to the configured tenant's ingestion manifest."""
    base_dir = Path(__file__).parent.parent.parent.parent
    tenant_dir = Path(settings.TENANT_DATA_DIR)
    
    if not tenant_dir.is_absolute():
        tenant_dir = (base_dir / tenant_dir).resolve()
        
    return tenant_dir / tenant_id / "organization_memory" / "metadata" / "ingestion_manifest.json"

def discover_ingestable_documents(tenant_id: str = "apex_precision") -> List[Dict[str, Any]]:
    """
    Reads the ingestion_manifest.json from the tenant's organization memory
    and returns an ordered list of documents pending ingestion (Type A),
    sorted by ingestion_priority.
    """
    manifest_path = get_tenant_manifest_path(tenant_id)
    
    if not manifest_path.exists():
        ingestion_logger.error(f"Manifest not found at {manifest_path}")
        return []
        
    try:
        with open(manifest_path, "r", encoding="utf-8") as f:
            manifest_data = json.load(f)
            
        # Filter for documents that are meant to be ingested and sort by priority
        ingest_docs = [
            doc for doc in manifest_data 
            if doc.get("status") == "pending_ingestion" 
            and doc.get("ingestion_priority") is not None
        ]
        
        # Sort by ingestion_priority ascending
        ingest_docs.sort(key=lambda x: x["ingestion_priority"])
        
        ingestion_logger.info(f"Discovered {len(ingest_docs)} documents for ingestion.")
        return ingest_docs
        
    except Exception as e:
        ingestion_logger.error(f"Failed to read manifest: {e}")
        return []
