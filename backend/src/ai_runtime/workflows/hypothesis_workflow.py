"""Hypothesis workflow: generates, validates, and stores AI root-cause hypotheses."""
from __future__ import annotations

import json
import logging
import re
import time
import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.ai_runtime.adapters.inference_adapter import get_inference_adapter
from src.ai_runtime.citation_validator import CitationValidator
from src.ai_runtime.cost_optimizer import CostOptimizer
from src.ai_runtime.evaluation_engine import EvaluationEngine
from src.ai_runtime.models import Hypothesis
from src.ai_runtime.observability import trace_ai_operation, tracker
from src.ai_runtime.policy_engine import PolicyEngine
from src.ai_runtime.prompt_engine import get_prompt_engine
from src.ai_runtime.retrieval_engine import RetrievalEngine
from src.investigation.models import Investigation

logger = logging.getLogger("helix.ai_runtime.workflows.hypothesis_workflow")


class HypothesisWorkflow:
    """Orchestrates RAG-based root-cause hypothesis generation and validation."""

    def __init__(self, db: AsyncSession) -> None:
        self._db = db
        self._prompt_engine = get_prompt_engine()
        self._retrieval_engine = RetrievalEngine(db)
        self._citation_validator = CitationValidator()
        self._policy_engine = PolicyEngine()

    async def execute(
        self,
        investigation_id: uuid.UUID,
        org_id: uuid.UUID,
        user_role: str,
        num_hypotheses: int = 3,
    ) -> list[Hypothesis]:
        """Execute RAG pipeline to generate root-cause hypotheses.

        1. Semantically retrieves relevant evidence chunks.
        2. Reranks evidence chunks.
        3. Formulates LLM prompt with few-shot JSON formatting examples.
        4. Calls configured LLM (e.g. Gemma on AMD/Fireworks).
        5. Validates LLM-cited texts against database chunks.
        6. Enforces policy filters and records metrics.
        7. Commits hypotheses to DB and returns them.
        """
        start_time = time.perf_counter()

        async with trace_ai_operation("hypothesis_generation", investigation_id) as trace_meta:
            # 1. Fetch Investigation
            stmt = select(Investigation).where(
                Investigation.id == investigation_id, Investigation.org_id == org_id
            )
            result = await self._db.execute(stmt)
            investigation = result.scalar_one_or_none()
            if not investigation:
                raise ValueError("Investigation not found")

            # 2. Retrieve Relevant Evidence (RAG)
            query = f"{investigation.title} {investigation.description or ''}"
            # Embed query and retrieve matching chunks
            retrieved_chunks = await self._retrieval_engine.retrieve_for_query(
                query=query,
                org_id=org_id,
                top_k=15,
                source_types=["evidence"],
                investigation_id=investigation_id,
                min_score=0.1,
            )

            # Rerank retrieved candidates
            reranked_chunks = self._retrieval_engine.rerank(retrieved_chunks, query, top_k=8)

            evidence_chunks_formatted = [
                {
                    "id": str(c.chunk_id),
                    "content": c.content,
                    "source": c.metadata.get("filename", "Unknown"),
                    "score": c.score,
                }
                for c in reranked_chunks
            ]

            # 3. Render prompt
            prompt = self._prompt_engine.render_hypothesis_generation(
                investigation_title=investigation.title,
                investigation_description=investigation.description or "",
                evidence_chunks=evidence_chunks_formatted,
                num_hypotheses=num_hypotheses,
            )

            # Enforce prompt context limits
            prompt = self._policy_engine.enforce_prompt_limits(prompt)

            # 4. Invoke LLM via Inference Adapter
            from src.shared.config import settings  # noqa: PLC0415

            provider = settings.INFERENCE_PROVIDER
            model = settings.FIREWORKS_MODEL if provider == "fireworks" else settings.OPENAI_MODEL
            if provider == "local":
                model = settings.LOCAL_MODEL

            adapter = get_inference_adapter(provider)
            messages = [
                {
                    "role": "system",
                    "content": "You are a senior Root Cause Analysis expert. You MUST output ONLY valid JSON matching the requested structure.",
                },
                {"role": "user", "content": prompt},
            ]

            response_text = await adapter.complete(messages)

            # 5. Parse structured JSON from response
            hypotheses_data = self._parse_json_response(response_text)

            # Measure token usage and costs
            prompt_tokens = CostOptimizer.count_tokens_approx(prompt)
            completion_tokens = CostOptimizer.count_tokens_approx(response_text)
            cost_usd = CostOptimizer.calculate_cost(
                provider, model, prompt_tokens, completion_tokens
            )
            latency_ms = (time.perf_counter() - start_time) * 1000.0

            # Record call in tracker
            tracker.record_call(
                provider, model, prompt_tokens, completion_tokens, cost_usd, latency_ms
            )

            # 6. Validate citations and resolve back to DB chunk IDs
            hypotheses_to_save: list[Hypothesis] = []
            for item in hypotheses_data:
                title = item.get("title", "Unnamed Hypothesis")
                content = item.get("content", "")
                conf_score = float(item.get("confidence_score", 0.5))

                raw_citations = item.get("citations", [])
                resolved_citations = []
                valid_cit_count = 0

                # Match cited text against our retrieved database chunks
                for rc in raw_citations:
                    cited_text = rc.get("text", "")
                    best_match_chunk_id = None
                    best_match_source = rc.get("source", "Unknown")
                    best_score = 0.0

                    for c in reranked_chunks:
                        sim = self._citation_validator._compute_similarity(cited_text, c.content)
                        if sim > best_score:
                            best_score = sim
                            best_match_chunk_id = c.chunk_id
                            best_match_source = c.metadata.get("filename", best_match_source)

                    # If similarity is sufficient, resolve it
                    is_valid = best_score >= self._citation_validator.similarity_threshold
                    resolved_citations.append(
                        {
                            "chunk_id": str(best_match_chunk_id) if best_match_chunk_id else None,
                            "text": cited_text,
                            "score": round(best_score, 4),
                            "source": best_match_source,
                            "is_valid": is_valid,
                        }
                    )
                    if is_valid:
                        valid_cit_count += 1

                # Calculate grounding score for this hypothesis
                grounding_score = EvaluationEngine.calculate_grounding_score(
                    valid_citations=valid_cit_count,
                    total_citations=len(resolved_citations),
                )

                # Check policy filters for this hypothesis
                policy_res = self._policy_engine.check_content(
                    content=content,
                    confidence_score=conf_score,
                    grounding_score=grounding_score,
                )

                # Flag if policy rejected it due to low grounding/confidence
                # Note: we still save it but set status or flag it so reviewers can see the warning.
                status = "pending"
                if not policy_res.passed:
                    logger.warning("Hypothesis policy warning: %s", policy_res.violations)

                hypothesis = Hypothesis(
                    investigation_id=investigation_id,
                    org_id=org_id,
                    title=title,
                    content=policy_res.filtered_content,
                    evidence_citations=resolved_citations,
                    confidence_score=conf_score,
                    grounding_score=grounding_score,
                    status=status,
                    generation_metadata={
                        "provider": provider,
                        "model": model,
                        "cost_usd": cost_usd,
                        "latency_ms": latency_ms,
                        "violations": policy_res.violations,
                    },
                )
                self._db.add(hypothesis)
                hypotheses_to_save.append(hypothesis)

            await self._db.commit()

            # Log overall evaluation metrics
            avg_grounding = (
                sum(h.grounding_score or 0.0 for h in hypotheses_to_save) / len(hypotheses_to_save)
                if hypotheses_to_save
                else 0.0
            )
            EvaluationEngine.log_evaluation_metrics(
                operation="hypothesis_generation",
                latency_ms=latency_ms,
                cost_usd=cost_usd,
                grounding_score=avg_grounding,
            )

            trace_meta["provider"] = provider
            trace_meta["model"] = model
            trace_meta["hypotheses_count"] = len(hypotheses_to_save)
            trace_meta["avg_grounding"] = avg_grounding

            # Refresh to load IDs
            for h in hypotheses_to_save:
                await self._db.refresh(h)

            return hypotheses_to_save

    def _parse_json_response(self, text: str) -> list[dict[str, Any]]:
        """Extract and parse JSON array from raw LLM output."""
        cleaned = text.strip()
        # Find JSON array using regex if surrounded by conversational text
        match = re.search(r"\[\s*\{.*\}\s*\]", cleaned, re.DOTALL)
        if match:
            cleaned = match.group(0)

        try:
            parsed = json.loads(cleaned)
            if isinstance(parsed, list):
                return parsed
        except json.JSONDecodeError:
            logger.error("Failed to parse JSON response: %s", text)

        # Fallback to a single-element list if it's a dict
        try:
            parsed = json.loads(cleaned)
            if isinstance(parsed, dict):
                return [parsed]
        except json.JSONDecodeError:
            pass

        # Return a simple mock structure as safety fallback
        logger.warning("LLM response failed to parse as JSON. Returning fallback.")
        return [
            {
                "title": "Unstructured Hypothesis",
                "content": text,
                "confidence_score": 0.5,
                "citations": [],
            }
        ]
