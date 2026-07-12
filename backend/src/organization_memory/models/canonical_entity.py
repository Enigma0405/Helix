from typing import List, Dict, Any
from pydantic import BaseModel, Field

class CanonicalEntity(BaseModel):
    """
    The output of the Entity Extractor. Represents a deterministic, machine-readable 
    business object (e.g., an Employee, an Equipment ID, a Deviation) found within documents.
    """
    entity_id: str = Field(..., description="Unique identifier for this entity (often normalized)")
    entity_type: str = Field(..., description="The classification of the entity, e.g., 'Equipment', 'SOP'")
    display_name: str = Field(..., description="Human-readable name of the entity")
    properties: Dict[str, Any] = Field(default_factory=dict, description="Key-value pairs of extracted attributes")
    mentions: List[str] = Field(default_factory=list, description="List of chunk_ids where this entity is explicitly mentioned")
