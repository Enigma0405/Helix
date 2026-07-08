"""CAPA workflow: generates AI-drafted Corrective and Preventive Action plans from approved hypotheses."""
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
from src.ai_runtime.models import CAPA, Hypothesis
from src.ai_runtime.observability import trace_ai_operation, tracker
from src.ai_runtime.policy_engine import PolicyEngine
from src.ai_runtime.prompt_engine import get_prompt_engine
from src.investigation.models import Investigation

logger = logging.getLogger("helix.ai_runtime.workflows.capa_workflow")


class CapaWorkflow:
    """Orchestrates CAPA generation from approved hypotheses."""

    def __init__(self, db: AsyncSession) -> None:
        self._db = db
        self._prompt_engine = get_prompt_engine()
        self._policy_engine = PolicyEngine()

    async def execute(
        self,
        investigation_id: uuid.UUID,
        org_id: uuid.UUID,
        user_role: str,
        org_context: str = "",
    ) -> CAPA:
        """Draft a CAPA plan based on the investigation's approved hypotheses.

        1. Fetches investigation and accepted hypotheses.
        2. Formulates a detailed prompt summarizing the root causes.
        3. Invokes the LLM to get a structured CAPA draft.
        4. Applies policy filters and registers metrics.
        5. Saves CAPA to DB and returns it.
        """
        start_time = time.perf_counter()

        async with trace_ai_operation("capa_drafting", investigation_id) as trace_meta:
            # 1. Fetch Investigation
            stmt = select(Investigation).where(
                Investigation.id == investigation_id, Investigation.org_id == org_id
            )
            result = await self._db.execute(stmt)
            investigation = result.scalar_one_or_none()
            if not investigation:
                raise ValueError("Investigation not found")

            # 2. Fetch Approved Hypotheses
            stmt_hyp = select(Hypothesis).where(
                Hypothesis.investigation_id == investigation_id,
                Hypothesis.org_id == org_id,
                Hypothesis.status == "accepted",
            )
            res_hyp = await self._db.execute(stmt_hyp)
            hypotheses = res_hyp.scalars().all()

            if not hypotheses:
                raise ValueError("Cannot draft CAPA: No approved hypotheses found for this investigation")

            hypotheses_formatted = [
                {"title": h.title, "content": h.content} for h in hypotheses
            ]

            # 3. Construct prompt
            # We can build a simple summary of the evidence
            evidence_summary = (
                f"Based on {len(hypotheses)} approved root-cause hypotheses: "
                + "; ".join(h.title for h in hypotheses)
            )

            prompt = self._prompt_engine.render_capa_draft(
                investigation_title=investigation.title,
                hypotheses=hypotheses_formatted,
                evidence_summary=evidence_summary,
                org_context=org_context,
            )

            # Enforce prompt context limits
            prompt = self._policy_engine.enforce_prompt_limits(prompt)

            # 4. Invoke LLM via Inference Adapter
            from src.core.config import settings  # noqa: PLC0415

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
                operation="capa_drafting",
                latency_ms=latency_ms,
                cost_usd=cost_usd,
            )

            # Save CAPA
            capa = CAPA(
                investigation_id=investigation_id,
                org_id=org_id,
                content=policy_res.filtered_content,
                status="draft",
                generation_metadata={
                    "provider": provider,
                    "model": model,
                    "cost_usd": cost_usd,
                    "latency_ms": latency_ms,
                    "violations": policy_res.violations,
                },
            )
            self._db.add(capa)
            await self._db.commit()
            await self._db.refresh(capa)

            trace_meta["provider"] = provider
            trace_meta["model"] = model
            trace_meta["cost_usd"] = cost_usd

            return capa
