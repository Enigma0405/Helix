"""Investigation workflow: generates a comprehensive AI summary of an investigation."""
from __future__ import annotations

import logging
import time
import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.ai_runtime.adapters.inference_adapter import get_inference_adapter
from src.ai_runtime.cost_optimizer import CostOptimizer
from src.ai_runtime.evaluation_engine import EvaluationEngine
from src.ai_runtime.observability import trace_ai_operation, tracker
from src.ai_runtime.policy_engine import PolicyEngine
from src.ai_runtime.prompt_engine import get_prompt_engine
from src.evidence.models import EvidenceItem
from src.investigation.models import Investigation

logger = logging.getLogger("helix.ai_runtime.workflows.investigation_workflow")


class InvestigationWorkflow:
    """Orchestrates RAG-based investigation summarization."""

    def __init__(self, db: AsyncSession) -> None:
        self._db = db
        self._prompt_engine = get_prompt_engine()
        self._policy_engine = PolicyEngine()

    async def execute(
        self,
        investigation_id: uuid.UUID,
        org_id: uuid.UUID,
        user_role: str,
    ) -> dict[str, Any]:
        """Summarize an investigation's context and evidence.

        Retrieves investigation details and its evidence item metadata,
        constructs a prompt, calls the configured LLM, and applies policy checks.
        """
        start_time = time.perf_counter()

        async with trace_ai_operation("investigation_summary", investigation_id) as trace_meta:
            # 1. Fetch Investigation
            stmt = select(Investigation).where(
                Investigation.id == investigation_id, Investigation.org_id == org_id
            )
            result = await self._db.execute(stmt)
            investigation = result.scalar_one_or_none()
            if not investigation:
                raise ValueError("Investigation not found")

            # 2. Fetch Evidence Metadata
            stmt_evidence = select(EvidenceItem).where(
                EvidenceItem.investigation_id == investigation_id,
                EvidenceItem.org_id == org_id,
                EvidenceItem.status == "processed",
            )
            res_evidence = await self._db.execute(stmt_evidence)
            evidence_items = res_evidence.scalars().all()

            evidence_list = [
                {
                    "filename": item.original_filename,
                    "mime_type": item.mime_type,
                    "created_at": item.created_at.isoformat() if item.created_at else "",
                }
                for item in evidence_items
            ]

            # 3. Construct prompt
            prompt = self._prompt_engine.render_investigation_summary(
                investigation_title=investigation.title,
                investigation_description=investigation.description or "",
                evidence_items=evidence_list,
                hypotheses=[],  # No hypotheses approved yet at this stage
            )

            # Enforce prompt length guardrail
            prompt = self._policy_engine.enforce_prompt_limits(prompt)

            # 4. Invoke LLM via Inference Adapter
            from src.shared.config import settings  # noqa: PLC0415

            provider = settings.INFERENCE_PROVIDER
            model = settings.FIREWORKS_MODEL if provider == "fireworks" else settings.OPENAI_MODEL
            if provider == "local":
                model = settings.LOCAL_MODEL

            adapter = get_inference_adapter(provider)
            messages = [{"role": "user", "content": prompt}]

            response_text = await adapter.complete(messages)

            # 5. Measure token usages and cost
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

            # Apply policy checks
            policy_res = self._policy_engine.check_content(response_text)

            # Log metrics via evaluation engine
            EvaluationEngine.log_evaluation_metrics(
                operation="investigation_summary",
                latency_ms=latency_ms,
                cost_usd=cost_usd,
            )

            trace_meta["provider"] = provider
            trace_meta["model"] = model
            trace_meta["cost_usd"] = cost_usd
            trace_meta["tokens"] = prompt_tokens + completion_tokens

            return {
                "summary": policy_res.filtered_content,
                "provider": provider,
                "model": model,
                "cost_usd": cost_usd,
                "latency_ms": latency_ms,
            }
