from typing import Optional
from src.organization_memory.models import (
    CanonicalDocument,
    CanonicalChunk,
    CanonicalEntity,
    CanonicalRelationship,
    CanonicalMetadata
)
from src.organization_memory.storage.storage_adapter import StorageAdapter

class OrganizationMemoryRepository:
    """
    Coordinates saving and loading Canonical models into the organization memory.
    Delegates raw I/O to the injected StorageAdapter.
    """
    
    def __init__(self, adapter: StorageAdapter):
        self.adapter = adapter
        
    def save_document(self, tenant_id: str, doc: CanonicalDocument) -> None:
        # Pydantic v2 uses model_dump() (dict() is deprecated in v2)
        # We will use dict() if v1, or model_dump() if v2. Let's assume standard compatible fallback
        data = doc.model_dump(mode="json") if hasattr(doc, "model_dump") else doc.dict()
        # Convert datetime to ISO string for JSON serialization
        if not isinstance(data.get("ingested_at"), str):
            data["ingested_at"] = doc.ingested_at.isoformat()
        self.adapter.save(tenant_id, "canonical", doc.doc_id, data)
        
    def save_chunk(self, tenant_id: str, chunk: CanonicalChunk) -> None:
        data = chunk.model_dump(mode="json") if hasattr(chunk, "model_dump") else chunk.dict()
        self.adapter.save(tenant_id, "chunks", chunk.chunk_id, data)
        
    def save_entity(self, tenant_id: str, entity: CanonicalEntity) -> None:
        data = entity.model_dump(mode="json") if hasattr(entity, "model_dump") else entity.dict()
        self.adapter.save(tenant_id, "entities", entity.entity_id, data)
        
    def save_relationship(self, tenant_id: str, rel: CanonicalRelationship) -> None:
        data = rel.model_dump(mode="json") if hasattr(rel, "model_dump") else rel.dict()
        self.adapter.save(tenant_id, "relationships", rel.relationship_id, data)
        
    def save_metadata(self, tenant_id: str, metadata: CanonicalMetadata) -> None:
        data = metadata.model_dump(mode="json") if hasattr(metadata, "model_dump") else metadata.dict()
        if not isinstance(data.get("last_ingestion_run"), str):
            data["last_ingestion_run"] = metadata.last_ingestion_run.isoformat()
        self.adapter.save(tenant_id, "metadata", "canonical_state", data)
