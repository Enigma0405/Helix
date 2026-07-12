import json
from typing import Dict, Any
from src.runtime.llm.inference_adapter import InferenceAdapter

class MockAdapter(InferenceAdapter):
    """
    Mock inference provider for local testing and deterministic fallback.
    Returns a static dummy response matching InvestigationAssessment schema.
    """
    
    def generate_assessment(self, prompt: str) -> Dict[str, Any]:
        """Returns a static response."""
        return {
            "summary": "[MOCK] The deviation approval workflow requires QA approval and a verified root cause analysis before closure.",
            "confidence": {
                "level": "HIGH",
                "score": 0.95,
                "explanation": "[MOCK] Computed confidence passed through."
            },
            "evidence": [
                {
                    "document_id": "doc_mock_123",
                    "chunk_id": "chunk_mock_456",
                    "title": "[MOCK] SOP-023",
                    "section": "Section 4.1",
                    "page": "Page 2"
                }
            ],
            "missing_evidence": [
                "[MOCK] Missing the final QA signature log."
            ],
            "contradictions": [],
            "recommendations": [
                "[MOCK] Ensure all future deviations include root cause documentation."
            ],
            "next_actions": [
                "[MOCK] Escalate to Quality Assurance Manager."
            ],
            "reasoning_trace_id": "trace_mock_001"
        }
