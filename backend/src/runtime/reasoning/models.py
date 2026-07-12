from typing import List, Optional
from pydantic import BaseModel, Field

class EvidenceCitation(BaseModel):
    """Citation linking an answer back to its canonical source."""
    document_id: str
    chunk_id: str
    title: str = "Unknown"
    text: Optional[str] = None
    # To support detailed citations later (section, page) we keep this open-ended
    section: Optional[str] = None
    page: Optional[str] = None

class ConfidenceScore(BaseModel):
    """Deterministic confidence computed by the reasoning engine."""
    level: str = Field(..., description="HIGH, MEDIUM, or LOW")
    score: float = Field(..., description="Numerical score between 0.0 and 1.0")
    explanation: str = Field(..., description="Explanation of why this confidence level was assigned based on retrieval metrics and evidence count.")

class Contradiction(BaseModel):
    """A deterministic flag of conflicting evidence."""
    description: str = Field(..., description="Description of the conflicting data points found in the retrieved evidence.")
    involved_chunks: List[str] = Field(..., description="The chunk IDs that conflict.")

class ReasoningTrace(BaseModel):
    """INTERNAL ONLY: Trace of how the answer was constructed."""
    question: str
    retrieved_chunk_ids: List[str]
    retrieval_scores: List[float]
    selected_chunks: List[str]
    confidence_inputs: dict
    prompt_hash: str
    model_used: str
    latency_ms: float
    timestamp: str

class InvestigationAssessment(BaseModel):
    """The final structured output of the Intelligence Layer."""
    summary: str = Field(..., description="Direct answer to the user's question, grounded strictly in evidence.")
    confidence: ConfidenceScore
    evidence: List[EvidenceCitation]
    missing_evidence: List[str] = Field(..., description="List of evidence or required fields that were missing to fully answer the query.")
    contradictions: List[Contradiction] = Field(default_factory=list, description="Any contradictions flagged between the pieces of evidence.")
    recommendations: List[str] = Field(default_factory=list, description="Recommended steps to take based on the investigation.")
    next_actions: List[str] = Field(default_factory=list, description="Immediate next steps required.")
    reasoning_trace_id: str = Field(..., description="Internal trace ID for auditability.")
