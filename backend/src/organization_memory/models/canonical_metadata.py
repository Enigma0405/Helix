from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field

class CanonicalMetadata(BaseModel):
    """
    Tracks the state, versioning, and integrity of the ingestion process for 
    the organization memory.
    """
    schema_version: str = Field(default="1.0", description="The schema version of canonical memory")
    last_ingestion_run: datetime = Field(default_factory=datetime.utcnow, description="Timestamp of last ingestion")
    parser_version: str = Field(default="1.0.0", description="Version of the parsing logic used")
    entity_extractor_version: str = Field(default="1.0.0", description="Version of the entity extraction logic")
    total_documents: int = Field(default=0, description="Total documents processed")
    total_chunks: int = Field(default=0, description="Total chunks generated")
    total_entities: int = Field(default=0, description="Total unique entities extracted")
    total_relationships: int = Field(default=0, description="Total relationships formed")
    integrity_hash: Optional[str] = Field(None, description="SHA-256 hash of the full canonical output for verification")
