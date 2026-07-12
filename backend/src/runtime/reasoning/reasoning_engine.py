from typing import List, Dict, Any, Tuple
from src.knowledge.vector_store import DocumentChunkEmbedding
from src.runtime.reasoning.models import ConfidenceScore, Contradiction

class ReasoningEngine:
    """Handles deterministic logic for intelligence (confidence, missing evidence, contradictions)."""
    
    def __init__(self):
        pass

    def compute_confidence(self, chunks: List[DocumentChunkEmbedding], avg_retrieval_distance: float) -> ConfidenceScore:
        """
        Deterministically computes confidence based on available evidence count and retrieval similarity.
        Note: The distance from pgvector is cosine distance (0 is exact match, 2 is diametrically opposed).
        Smaller distance means higher similarity.
        """
        count = len(chunks)
        # Convert average distance to a similarity score (0 to 1) roughly
        similarity = max(0.0, 1.0 - (avg_retrieval_distance / 2.0))
        
        # Base confidence calculation
        score = min(1.0, (similarity * 0.7) + (min(count / 5.0, 1.0) * 0.3))
        
        if count == 0:
            level = "LOW"
            explanation = "No relevant evidence found in the organization memory."
            score = 0.0
        elif score > 0.8 and count >= 2:
            level = "HIGH"
            explanation = f"Strong retrieval similarity ({similarity:.2f}) across multiple evidence chunks ({count})."
        elif score > 0.5:
            level = "MEDIUM"
            explanation = f"Moderate similarity ({similarity:.2f}) with {count} supporting chunks."
        else:
            level = "LOW"
            explanation = f"Weak similarity ({similarity:.2f}) or insufficient chunks ({count})."
            
        return ConfidenceScore(level=level, score=score, explanation=explanation)

    def compute_missing_evidence(self, chunks: List[DocumentChunkEmbedding], question: str) -> List[str]:
        """
        Deterministically checks if expected document types are missing based on the question.
        """
        missing = []
        ctx_lower = " ".join([c.semantic_context for c in chunks if c.semantic_context]).lower()
        
        if "deviation" in question.lower() or "capa" in question.lower():
            if "sop" not in ctx_lower:
                missing.append("Standard Operating Procedure (SOP) governing the process")
            if "capa" not in ctx_lower and "investigation" not in ctx_lower:
                missing.append("Historical CAPA or Investigation records")
                
        if "equipment" in question.lower() or "cleaning" in question.lower():
            if "log" not in ctx_lower and "record" not in ctx_lower:
                missing.append("Equipment usage or cleaning log")
                
        return missing

    def detect_contradictions(self, chunks: List[DocumentChunkEmbedding]) -> List[Contradiction]:
        """
        Deterministically detects contradictions.
        For example, scanning for conflicting categorical values or numbers.
        """
        contradictions = []
        
        # A very basic deterministic example: finding multiple equipment IDs mentioned
        eq_ids = set()
        chunk_map = {}
        
        import re
        for chunk in chunks:
            # Find patterns like EQ-12, EQ-14, etc.
            matches = re.findall(r'EQ-\d{2,}', chunk.text)
            for m in matches:
                eq_ids.add(m)
                if m not in chunk_map:
                    chunk_map[m] = []
                chunk_map[m].append(chunk.chunk_id)
                
        if len(eq_ids) > 1:
            contradictions.append(Contradiction(
                description=f"Multiple distinct Equipment IDs found in context: {', '.join(eq_ids)}. Verify if this refers to the same event.",
                involved_chunks=list(set([cid for sublist in chunk_map.values() for cid in sublist]))
            ))
            
        return contradictions
