import time
import uuid
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from src.knowledge.retriever import DocumentRetriever
from src.runtime.reasoning.reasoning_engine import ReasoningEngine
from src.runtime.reasoning.prompt_builder import PromptBuilder
from src.runtime.llm.inference_adapter import InferenceAdapter
from src.runtime.reasoning.models import (
    InvestigationAssessment, 
    ReasoningTrace, 
    EvidenceCitation
)
from src.shared.logging import application_logger

class IntelligenceService:
    """Facade for the intelligence layer of Helix."""
    
    def __init__(
        self, 
        retriever: DocumentRetriever, 
        inference_adapter: InferenceAdapter
    ):
        self.retriever = retriever
        self.inference_adapter = inference_adapter
        self.reasoning_engine = ReasoningEngine()
        self.prompt_builder = PromptBuilder()

    async def run_investigation(
        self, 
        session: AsyncSession, 
        tenant_id: str, 
        question: str
    ) -> InvestigationAssessment:
        """Runs the full pipeline to answer an investigation question."""
        start_time = time.time()
        
        # 1. Retrieve Candidate Evidence
        # We retrieve top 10 first to give reasoning engine/prompt builder options to rank
        chunks = await self.retriever.retrieve(session, tenant_id, question, top_k=10)
        
        # 2. Evidence Selector & Deduplication
        ranked_chunks = self.prompt_builder.deduplicate_and_rank(chunks)
        selected_chunks = self.prompt_builder.compress_context(ranked_chunks)
        
        # Compute avg retrieval distance for confidence
        # Since we don't have distance directly in the models from the current retriever, we fake it or use a default 
        # (In a real scenario, retriever would yield (chunk, distance)).
        # For now, let's pass a placeholder 0.5 distance
        avg_dist = 0.5 
        
        # 3. Reasoning Engine
        confidence = self.reasoning_engine.compute_confidence(selected_chunks, avg_dist)
        missing_evidence = self.reasoning_engine.compute_missing_evidence(selected_chunks, question)
        contradictions = self.reasoning_engine.detect_contradictions(selected_chunks)
        
        # 4. Prompt Construction
        # We pass contradictions so the LLM can explain them
        prompt = self.prompt_builder.build_prompt(
            question=question, 
            chunks=selected_chunks,
            contradictions=[c.model_dump() for c in contradictions]
        )
        prompt_hash = str(hash(prompt))
        
        # 5. Inference
        llm_output = self.inference_adapter.generate_assessment(prompt)
        
        # 6. Parse LLM Output and Combine with Deterministic Reasoning
        evidence_citations = []
        chunk_map = {c.chunk_id: c for c in chunks}
        
        for e in llm_output.get("evidence", []):
            chunk_id = e.get("chunk_id", "unknown")
            chunk_text = None
            if chunk_id in chunk_map:
                chunk_text = chunk_map[chunk_id].text
                
            evidence_citations.append(EvidenceCitation(
                document_id=e.get("document_id", "unknown"),
                chunk_id=chunk_id,
                title=e.get("title", "Unknown"),
                text=chunk_text,
                section=e.get("section"),
                page=e.get("page")
            ))
            
        trace_id = str(uuid.uuid4())
        
        assessment = InvestigationAssessment(
            summary=llm_output.get("summary", "No summary provided."),
            confidence=confidence,
            evidence=evidence_citations,
            missing_evidence=missing_evidence,
            contradictions=contradictions,
            recommendations=llm_output.get("recommendations", []),
            next_actions=llm_output.get("next_actions", []),
            reasoning_trace_id=trace_id
        )
        
        # 7. Generate Internal Trace
        trace = ReasoningTrace(
            question=question,
            retrieved_chunk_ids=[c.chunk_id for c in chunks],
            retrieval_scores=[0.5] * len(chunks), # placeholder
            selected_chunks=[c.chunk_id for c in selected_chunks],
            confidence_inputs={"avg_dist": avg_dist, "count": len(selected_chunks)},
            prompt_hash=prompt_hash,
            model_used=self.inference_adapter.__class__.__name__,
            latency_ms=(time.time() - start_time) * 1000,
            timestamp=str(time.time())
        )
        
        application_logger.info(f"Generated InvestigationAssessment. Trace ID: {trace_id}")
        
        return assessment
