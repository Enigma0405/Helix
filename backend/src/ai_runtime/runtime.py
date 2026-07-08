"""AI Runtime Orchestrator: HelixAIRuntime.

Central entry point for all AI capabilities. Orchestrates the Workflow Engine and
provides unified access to inference, embeddings, and validation.
"""
from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from src.ai_runtime.adapters.embedding_adapter import get_embedding_adapter
from src.ai_runtime.adapters.inference_adapter import get_inference_adapter
from src.ai_runtime.citation_validator import CitationValidator
from src.ai_runtime.cost_optimizer import CostOptimizer
from src.ai_runtime.evaluation_engine import EvaluationEngine
from src.ai_runtime.models import CAPA, Hypothesis
from src.ai_runtime.policy_engine import PolicyEngine
from src.ai_runtime.retrieval_engine import RetrievalEngine
from src.ai_runtime.workflows.capa_workflow import CapaWorkflow
from src.ai_runtime.workflows.hypothesis_workflow import HypothesisWorkflow
from src.ai_runtime.workflows.investigation_workflow import InvestigationWorkflow
from src.ai_runtime.workflows.knowledge_capture_workflow import KnowledgeCaptureWorkflow


class HelixAIRuntime:
    """The central orchestrator for the Project Helix AI Runtime.

    Decoupled into structural Workflow objects to permit independent scaling of
    business logic (deviations, complaints, assets) while maintaining a constant
    set of AI primitives (inference, embeddings, policies).
    """

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.inference_adapter = get_inference_adapter()
        self.embedding_adapter = get_embedding_adapter()
        self.retrieval_engine = RetrievalEngine(db)
        self.citation_validator = CitationValidator()
        self.policy_engine = PolicyEngine()
        self.evaluation_engine = EvaluationEngine()
        self.cost_optimizer = CostOptimizer()

    async def generate_hypotheses(
        self,
        investigation_id: uuid.UUID,
        org_id: uuid.UUID,
        user_role: str,
        num_hypotheses: int = 3,
    ) -> list[Hypothesis]:
        """Execute RAG root-cause hypothesis generation workflow."""
        workflow = HypothesisWorkflow(self.db)
        return await workflow.execute(
            investigation_id=investigation_id,
            org_id=org_id,
            user_role=user_role,
            num_hypotheses=num_hypotheses,
        )

    async def draft_capa(
        self,
        investigation_id: uuid.UUID,
        org_id: uuid.UUID,
        user_role: str,
        org_context: str = "",
    ) -> CAPA:
        """Execute RAG corrective and preventive action drafting workflow."""
        workflow = CapaWorkflow(self.db)
        return await workflow.execute(
            investigation_id=investigation_id,
            org_id=org_id,
            user_role=user_role,
            org_context=org_context,
        )

    async def summarize_investigation(
        self,
        investigation_id: uuid.UUID,
        org_id: uuid.UUID,
        user_role: str,
    ) -> dict[str, Any]:
        """Execute RAG investigation summary workflow."""
        workflow = InvestigationWorkflow(self.db)
        return await workflow.execute(
            investigation_id=investigation_id,
            org_id=org_id,
            user_role=user_role,
        )

    async def capture_knowledge(
        self,
        investigation_id: uuid.UUID,
        org_id: uuid.UUID,
        user_role: str,
        created_by_user_id: uuid.UUID,
    ) -> dict[str, Any]:
        """Execute closed-loop knowledge capture workflow for closed investigations."""
        workflow = KnowledgeCaptureWorkflow(self.db)
        return await workflow.execute(
            investigation_id=investigation_id,
            org_id=org_id,
            user_role=user_role,
            created_by_user_id=created_by_user_id,
        )
