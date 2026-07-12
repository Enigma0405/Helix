from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field

class CanonicalEvidence(BaseModel):
    """
    Used exclusively during Live Investigations by the AI Runtime. Represents real-world 
    events or anomalies mapped against the established Organization Memory.
    """
    evidence_id: str = Field(..., description="Unique identifier for this piece of live evidence")
    investigation_id: str = Field(..., description="The ID of the investigation this belongs to")
    source_event: str = Field(..., description="URI or path to the source event file in live_evidence/")
    description: str = Field(..., description="Summary or description of the anomaly/event")
    extracted_entities: List[str] = Field(default_factory=list, description="List of entity_ids found in this evidence")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="When the event occurred or was logged")
    confidence_score: Optional[float] = Field(None, description="Confidence of the extraction/mapping")
