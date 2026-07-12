from typing import Any, Dict, Optional
from datetime import datetime
from pydantic import BaseModel, Field

class CanonicalDocument(BaseModel):
    """
    The foundational output of the Parser. Represents a normalized version 
    of an immutable source file (PDF, CSV, XLSX, etc.) into clean text and 
    extracted semantic metadata.
    """
    doc_id: str = Field(..., description="Unique identifier for the document")
    source_file: str = Field(..., description="Relative path to the immutable source file in the tenant's data dir")
    hash: str = Field(..., description="SHA-256 hash of the original source file")
    content_type: str = Field(..., description="MIME type of the source file, e.g., application/pdf")
    title: str = Field(..., description="Extracted or derived title of the document")
    normalized_content: str = Field(..., description="The raw, unchunked, normalized markdown or text content")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Extracted metadata (author, date, parser version)")
    ingested_at: datetime = Field(default_factory=datetime.utcnow, description="When this document was ingested")
