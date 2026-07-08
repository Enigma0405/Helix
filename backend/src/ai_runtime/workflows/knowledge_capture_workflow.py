"""Knowledge capture workflow: runs after an investigation is closed to capture learnings into the knowledge base."""
from __future__ import annotations

import logging
import time
import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.ai_runtime.adapters.embedding_adapter import get_embedding_adapter
from src.ai_runtime.adapters.inference_adapter import get_inference_adapter
from src.ai_runtime.cost_optimizer import CostOptimizer
from src.ai_runtime.evaluation_engine import EvaluationEngine
from src.ai_runtime.models import CAPA, Hypothesis
from src.ai_runtime.observability import trace_ai_operation, tracker
from src.ai_runtime.policy_engine import PolicyEngine
from src.ai_runtime.prompt_engine import get_prompt_engine
from src.investigation.models import Investigation
from src.knowledge.models import Chunk, Document, Embedding

logger = logging.getLogger("helix.ai_runtime.workflows.knowledge_capture_workflow")


class KnowledgeCaptureWorkflow:
    """Orchestrates closed-loop knowledge capture from closed investigations."""

    def __init__(self, db: AsyncSession) -> None:
        self._db = db
        self._prompt_engine = get_prompt_engine()
        self._policy_engine = PolicyEngine()

    async def execute(
        self,
        investigation_id: uuid.UUID,
        org_id: uuid.UUID,
        user_role: str,
        created_by_user_id: uuid.UUID,
    ) -> dict[str, Any]:
        """Process a closed investigation, extract lessons learned, and store as a Knowledge Base Document.

        1. Fetches investigation details, accepted hypotheses, and approved CAPAs.
        2. Prompts LLM to extract a high-density "SOP and CAPA Reference Summary".
        3. Saves this summary as a Document of doc_type='capa' in the Knowledge Base.
        4. Chunks the document and embeds it via pgvector for future retrieval.
        """
        start_time = time.perf_counter()

        async with trace_ai_operation("knowledge_capture", investigation_id) as trace_meta:
            # 1. Fetch Investigation
            stmt = select(Investigation).where(
                Investigation.id == investigation_id, Investigation.org_id == org_id
            )
            result = await self._db.execute(stmt)
            investigation = result.scalar_one_or_none()
            if not investigation:
                raise ValueError("Investigation not found")

            # 2. Fetch Hypotheses & CAPAs
            stmt_hyp = select(Hypothesis).where(
                Hypothesis.investigation_id == investigation_id,
                Hypothesis.org_id == org_id,
                Hypothesis.status == "accepted",
            )
            res_hyp = await self._db.execute(stmt_hyp)
            hypotheses = res_hyp.scalars().all()

            stmt_capa = select(CAPA).where(
                CAPA.investigation_id == investigation_id,
                CAPA.org_id == org_id,
                CAPA.status == "approved",
            )
            res_capa = await self._db.execute(stmt_capa)
            capas = res_capa.scalars().all()

            # Format details for prompt
            hypotheses_formatted = [
                {"title": h.title, "content": h.content} for h in hypotheses
            ]
            capas_formatted = [
                {"content": c.content} for c in capas
            ]

            # 3. Create learning prompt
            prompt = (
                f"You are a Quality Systems Archivist. Summarize this closed quality investigation for future RAG searches.\n\n"
                f"Investigation Title: {investigation.title}\n"
                f"Description: {investigation.description or ''}\n\n"
                f"Accepted Root Cause Hypotheses:\n"
                + "\n".join(f"- {h['title']}: {h['content']}" for h in hypotheses_formatted)
                + "\n\nApproved Corrective and Preventive Actions (CAPA):\n"
                + "\n".join(f"- {c['content']}" for c in capas_formatted)
                + "\n\nDraft a highly structured, dense reference document summarizing the core root causes, lessons learned, and preventive steps. "
                f"Do not include personal names. Focus on the physical system defects, human factors, and process parameters."
            )

            # 4. Invoke LLM via Inference Adapter
            from src.core.config import settings  # noqa: PLC0415

            provider = settings.INFERENCE_PROVIDER
            model = settings.FIREWORKS_MODEL if provider == "fireworks" else settings.OPENAI_MODEL
            if provider == "local":
                model = settings.LOCAL_MODEL

            adapter = get_inference_adapter(provider)
            messages = [{"role": "user", "content": prompt}]

            response_text = await adapter.complete(messages)

            # 5. Measure cost and latency
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
            captured_summary = policy_res.filtered_content

            # 6. Save as Knowledge base Document
            knowledge_doc = Document(
                org_id=org_id,
                title=f"Historical CAPA Summary: {investigation.title}",
                storage_key=f"knowledge-capture/{investigation_id}.txt",
                doc_type="capa",
                created_by=created_by_user_id,
            )
            self._db.add(knowledge_doc)
            await self._db.flush()  # get knowledge_doc.id

            # Save the summary text as a chunk
            chunk = Chunk(
                source_id=knowledge_doc.id,
                source_type="document",
                org_id=org_id,
                content=captured_summary,
                chunk_index=0,
                metadata_={
                    "investigation_id": str(investigation_id),
                    "filename": f"capa-{investigation_id}.txt",
                    "title": knowledge_doc.title,
                },
            )
            self._db.add(chunk)
            await self._db.flush()  # get chunk.id

            # Generate embedding
            embedding_adapter = get_embedding_adapter()
            vectors = await embedding_adapter.embed_batch([captured_summary])
            embedding_vector = vectors[0]

            embedding_record = Embedding(
                chunk_id=chunk.id,
                vector=embedding_vector,
                model_name=settings.EMBEDDING_MODEL_LOCAL if settings.EMBEDDING_PROVIDER == "local" else settings.EMBEDDING_MODEL_FIREWORKS,
            )
            self._db.add(embedding_record)
            await self._db.commit()

            trace_meta["provider"] = provider
            trace_meta["model"] = model
            trace_meta["cost_usd"] = cost_usd
            trace_meta["document_id"] = str(knowledge_doc.id)

            return {
                "document_id": knowledge_doc.id,
                "summary": captured_summary,
                "cost_usd": cost_usd,
                "latency_ms": latency_ms,
            }
