from typing import Optional
from pydantic import BaseModel, Field

class CanonicalChunk(BaseModel):
    """
    The output of the Chunker. Represents a semantically cohesive block of 
    text from a CanonicalDocument, optimized for vector embedding and retrieval.
    """
    chunk_id: str = Field(..., description="Unique identifier for the chunk")
    doc_id: str = Field(..., description="ID of the parent CanonicalDocument")
    text: str = Field(..., description="The raw text content of the chunk")
    start_char_idx: int = Field(..., description="Starting character index in the normalized document content")
    end_char_idx: int = Field(..., description="Ending character index in the normalized document content")
    semantic_context: Optional[str] = Field(None, description="Hierarchical context (e.g., Header > Subheader)")
    embedding_id: Optional[str] = Field(None, description="ID or pointer to the stored vector embedding")
    tokens: Optional[int] = Field(None, description="Number of tokens in the text")
