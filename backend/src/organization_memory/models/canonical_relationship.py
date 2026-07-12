from typing import List, Optional
from pydantic import BaseModel, Field

class CanonicalRelationship(BaseModel):
    """
    The output of the Relationship Extractor (Graph Generator). Defines directed edges 
    between CanonicalEntity nodes, forming the Organization Knowledge Graph.
    """
    relationship_id: str = Field(..., description="Unique identifier for this specific edge")
    source_entity_id: str = Field(..., description="The ID of the origin entity")
    target_entity_id: str = Field(..., description="The ID of the destination entity")
    relation_type: str = Field(..., description="The semantic nature of the relationship, e.g., 'GOVERNED_BY'")
    weight: float = Field(default=1.0, description="Confidence or strength weight of the relationship")
    evidence_chunks: List[str] = Field(default_factory=list, description="List of chunk_ids that support this relationship")
    context: Optional[str] = Field(None, description="A brief text snippet explaining the relationship")
