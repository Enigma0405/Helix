from pathlib import Path
from pydantic import BaseModel, Field

class IngestionContext(BaseModel):
    """
    Context passed into the parsing and extraction pipeline for a single document.
    """
    tenant_id: str = Field(..., description="Organization/tenant ID")
    ingestion_id: str = Field(..., description="Unique ID for this ingestion run")
    source_path: Path = Field(..., description="Physical path to the source file being ingested")
    content_type: str = Field(..., description="MIME type of the file, e.g. application/pdf")
    parser_version: str = Field(default="1.0.0", description="Version of the parser being used")
