from typing import List, Dict, Any
from src.knowledge.vector_store import DocumentChunkEmbedding
from src.shared.logging import application_logger

class PromptBuilder:
    """Constructs deterministic prompts for the LLM using token budgets and priority ranking."""
    
    # Priority assignments for document types (higher is better)
    SOURCE_PRIORITIES = {
        "sop": 100,
        "policy": 95,
        "manual": 80,
        "historical_capa": 70,
        "complaint": 60,
        "default": 50
    }
    
    MAX_CONTEXT_TOKENS = 4000 # Configurable limit for chunk tokens
    
    def __init__(self):
        pass
        
    def _get_priority(self, doc_id: str, semantic_context: str) -> int:
        """Determines the priority of a chunk based on its type/context."""
        ctx_lower = (semantic_context or "").lower()
        if "sop" in ctx_lower or "standard operating procedure" in ctx_lower:
            return self.SOURCE_PRIORITIES["sop"]
        if "policy" in ctx_lower:
            return self.SOURCE_PRIORITIES["policy"]
        if "manual" in ctx_lower:
            return self.SOURCE_PRIORITIES["manual"]
        if "capa" in ctx_lower or "investigation" in ctx_lower:
            return self.SOURCE_PRIORITIES["historical_capa"]
        if "complaint" in ctx_lower:
            return self.SOURCE_PRIORITIES["complaint"]
        
        return self.SOURCE_PRIORITIES["default"]

    def deduplicate_and_rank(self, chunks: List[DocumentChunkEmbedding]) -> List[DocumentChunkEmbedding]:
        """Removes duplicate chunks and ranks them by source priority."""
        seen = set()
        unique_chunks = []
        for chunk in chunks:
            if chunk.chunk_id not in seen:
                seen.add(chunk.chunk_id)
                unique_chunks.append(chunk)
                
        # Rank by priority (descending)
        ranked = sorted(
            unique_chunks, 
            key=lambda c: self._get_priority(c.doc_id, c.semantic_context), 
            reverse=True
        )
        return ranked

    def compress_context(self, ranked_chunks: List[DocumentChunkEmbedding]) -> List[DocumentChunkEmbedding]:
        """Truncates the context to fit within the token budget."""
        # Simple character-based heuristic for tokens (1 token ~= 4 chars)
        current_tokens = 0
        compressed = []
        for chunk in ranked_chunks:
            est_tokens = len(chunk.text) // 4
            if current_tokens + est_tokens <= self.MAX_CONTEXT_TOKENS:
                compressed.append(chunk)
                current_tokens += est_tokens
            else:
                application_logger.info(f"Token budget reached. Truncated {len(ranked_chunks) - len(compressed)} chunks.")
                break
                
        return compressed

    def build_prompt(
        self, 
        question: str, 
        chunks: List[DocumentChunkEmbedding], 
        contradictions: List[Dict[str, Any]]
    ) -> str:
        """Constructs the final system and user prompt."""
        
        system_prompt = (
            "You are Helix, an enterprise AI assistant for quality management and CAPA investigations.\n"
            "You must answer the user's question STRICTLY using the provided Evidence Context.\n"
            "Do not hallucinate. If the answer is not in the context, explicitly state that.\n"
            "Format your response EXACTLY to match the InvestigationAssessment JSON schema.\n"
        )
        
        evidence_str = "\n--- EVIDENCE CONTEXT ---\n"
        for i, c in enumerate(chunks):
            evidence_str += f"[Chunk {i+1} | ID: {c.chunk_id} | Doc: {c.doc_id}]\nContext: {c.semantic_context}\n{c.text}\n\n"
            
        contradiction_str = ""
        if contradictions:
            contradiction_str = "\n--- FLAGGED CONTRADICTIONS ---\n"
            for c in contradictions:
                contradiction_str += f"- {c['description']} (Chunks: {', '.join(c['involved_chunks'])})\n"
            contradiction_str += "Please explain these contradictions in your response if relevant.\n"

        user_prompt = f"Question: {question}\n"
        
        return f"{system_prompt}\n{evidence_str}\n{contradiction_str}\n{user_prompt}"
