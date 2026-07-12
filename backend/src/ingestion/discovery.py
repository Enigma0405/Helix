"""Scans Organization Seed for new or updated files to ingest. Idempotent check."""
import json
import os
from pathlib import Path
from typing import List, Dict, Any

from src.shared.config import settings
from src.shared.logging import ingestion_logger

def get_organization_memory_path() -> Path:
    """Returns the absolute path to the configured organization memory repository."""
    # Resolve relative to the backend/src directory if it's a relative path
    base_dir = Path(__file__).parent.parent.parent.parent
    configured_path = Path(settings.ORGANIZATION_MEMORY_DIR)
    
    if configured_path.is_absolute():
        return configured_path
    return (base_dir / configured_path).resolve()

def discover_ingestable_documents() -> List[Dict[str, Any]]:
    """
    Reads the manifest.json from the organization memory repository
    and returns an ordered list of documents pending ingestion (Type A),
    sorted by ingestion_priority.
    """
    repo_path = get_organization_memory_path()
    manifest_path = repo_path / "manifest.json"
    
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
