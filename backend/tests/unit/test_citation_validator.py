"""Unit tests for the citation validation grounding score and similarity calculations."""
from __future__ import annotations

from src.ai_runtime.citation_validator import CitationValidator


def test_validator_grounded_content():
    validator = CitationValidator(grounding_threshold=0.8, similarity_threshold=0.5)
    
    citations = [
        {"chunk_id": "1", "text": "The sterile filter FIL-022-A passed bubble point integrity testing.", "score": 0.9, "source": "filter_report.pdf"},
        {"chunk_id": "2", "text": "Gram-negative rods identified in QC samples on 2024-11-15.", "score": 0.8, "source": "qc_log.csv"}
    ]
    
    # 1. Grounded response: uses direct quotes or similar strings
    grounded_text = (
        "The sterile filter FIL-022-A passed bubble point integrity testing. "
        "Also, Gram-negative rods were identified in QC samples on 2024-11-15."
    )
    
    res = validator.validate(grounded_text, citations)
    assert res.is_grounded
    assert res.grounding_score == 1.0
    assert len(res.suspicious_claims) == 0


def test_validator_hallucinated_content():
    validator = CitationValidator(grounding_threshold=0.8, similarity_threshold=0.5)
    
    citations = [
        {"chunk_id": "1", "text": "The sterile filter FIL-022-A passed bubble point integrity testing.", "score": 0.9, "source": "filter_report.pdf"}
    ]
    
    # 2. Hallucinated response: mentions something not in the citations
    hallucinated_text = (
        "The sterile filter FIL-022-A passed bubble point integrity testing. "
        "The operator was not wearing correct gowning gear, causing contamination."
    )
    
    res = validator.validate(hallucinated_text, citations)
    assert not res.is_grounded
    assert res.grounding_score == 0.5  # 1 of 2 sentences grounded
    assert len(res.suspicious_claims) == 1
    assert "gowning" in res.suspicious_claims[0]
