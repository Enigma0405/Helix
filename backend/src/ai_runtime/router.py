"""AI Runtime Router: exposes endpoints for hypothesis and CAPA generation, review, and approval."""
from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.ai_runtime import service
from src.ai_runtime.schemas import (
    CapaApproveRequest,
    CapaOut,
    CapaUpdate,
    GenerateCapaRequest,
    GenerateHypothesesRequest,
    HypothesisOut,
    HypothesisUpdate,
    InvestigationSummaryOut,
    AssessRequest,
)
from src.api.dependencies import CurrentUser, RoleChecker, get_db

from src.runtime.intelligence_service import IntelligenceService
from src.knowledge.retriever import DocumentRetriever
from src.knowledge.embedder import EmbeddingService
from src.runtime.llm.fireworks_adapter import FireworksAdapter
from src.runtime.llm.mock_adapter import MockAdapter
import os
from src.runtime.reasoning.models import InvestigationAssessment

router = APIRouter(tags=["AI Runtime"])
DbDep = Annotated[AsyncSession, Depends(get_db)]

# Reroute helper dependencies
require_analyst = RoleChecker(["admin", "analyst"])
require_reviewer = RoleChecker(["admin", "reviewer"])


@router.post(
    "/api/investigations/{investigation_id}/hypotheses",
    response_model=list[HypothesisOut],
    status_code=status.HTTP_201_CREATED,
    summary="Generate root-cause hypotheses using AI RAG runtime",
    dependencies=[Depends(require_analyst)],
)
async def generate_hypotheses(
    investigation_id: uuid.UUID,
    req: GenerateHypothesesRequest,
    current_user: CurrentUser,
    db: DbDep,
) -> list[HypothesisOut]:
    """Retrieve evidence, run RAG model routing, and generate verified hypotheses."""
    res = await service.generate_hypotheses(
        db=db,
        investigation_id=investigation_id,
        org_id=current_user.org_id,
        req=req,
        user_id=current_user.user_id,
        user_role=current_user.role,
    )
    return [HypothesisOut.model_validate(h) for h in res]


@router.post(
    "/api/investigations/{investigation_id}/assess",
    response_model=InvestigationAssessment,
    status_code=status.HTTP_200_OK,
    summary="Generate a comprehensive Intelligence Layer assessment",
)
async def assess_investigation(
    investigation_id: uuid.UUID,
    req: AssessRequest,
    current_user: CurrentUser,
    db: DbDep,
) -> InvestigationAssessment:
    """Uses the deterministic Intelligence Layer to produce an evidence-backed assessment."""
    
    # Initialize Dependencies
    embedder = EmbeddingService()
    retriever = DocumentRetriever(embedder=embedder)
    
    if os.getenv("FIREWORKS_API_KEY"):
        adapter = FireworksAdapter()
        if not getattr(adapter, "client", None):
            adapter = MockAdapter()
    else:
        adapter = MockAdapter()

    intelligence_svc = IntelligenceService(retriever=retriever, inference_adapter=adapter)
    
    tenant_id = "apex_precision" # Hardcode tenant or extract from context if multi-tenant is active
    
    # Run pipeline
    assessment = await intelligence_svc.run_investigation(
        session=db,
        tenant_id=tenant_id,
        question=req.question
    )
    
    return assessment



@router.get(
    "/api/investigations/{investigation_id}/hypotheses",
    response_model=list[HypothesisOut],
    summary="Get all root-cause hypotheses generated for an investigation",
)
async def list_hypotheses(
    investigation_id: uuid.UUID,
    current_user: CurrentUser,
    db: DbDep,
) -> list[HypothesisOut]:
    res = await service.list_hypotheses(db, investigation_id, current_user.org_id)
    return [HypothesisOut.model_validate(h) for h in res]


@router.patch(
    "/api/hypotheses/{hypothesis_id}",
    response_model=HypothesisOut,
    summary="Review and update AI hypothesis status (accept/reject/modify)",
    dependencies=[Depends(require_analyst)],
)
async def update_hypothesis(
    hypothesis_id: uuid.UUID,
    req: HypothesisUpdate,
    current_user: CurrentUser,
    db: DbDep,
) -> HypothesisOut:
    res = await service.update_hypothesis(
        db=db,
        hypothesis_id=hypothesis_id,
        org_id=current_user.org_id,
        req=req,
        user_id=current_user.user_id,
    )
    return HypothesisOut.model_validate(res)


@router.post(
    "/api/investigations/{investigation_id}/capa",
    response_model=CapaOut,
    status_code=status.HTTP_201_CREATED,
    summary="Draft Corrective and Preventive Actions (CAPA) from approved hypotheses",
    dependencies=[Depends(require_analyst)],
)
async def generate_capa(
    investigation_id: uuid.UUID,
    req: GenerateCapaRequest,
    current_user: CurrentUser,
    db: DbDep,
) -> CapaOut:
    res = await service.draft_capa(
        db=db,
        investigation_id=investigation_id,
        org_id=current_user.org_id,
        req=req,
        user_id=current_user.user_id,
        user_role=current_user.role,
    )
    return CapaOut.model_validate(res)


@router.get(
    "/api/investigations/{investigation_id}/capa",
    response_model=CapaOut,
    summary="Get CAPA for an investigation",
)
async def get_capa(
    investigation_id: uuid.UUID,
    current_user: CurrentUser,
    db: DbDep,
) -> CapaOut:
    res = await service.get_capa(db, investigation_id, current_user.org_id)
    return CapaOut.model_validate(res)


@router.patch(
    "/api/capa/{capa_id}",
    response_model=CapaOut,
    summary="Modify CAPA content or status details",
    dependencies=[Depends(require_analyst)],
)
async def update_capa(
    capa_id: uuid.UUID,
    req: CapaUpdate,
    current_user: CurrentUser,
    db: DbDep,
) -> CapaOut:
    res = await service.update_capa(
        db=db,
        capa_id=capa_id,
        org_id=current_user.org_id,
        req=req,
        user_id=current_user.user_id,
    )
    return CapaOut.model_validate(res)


@router.post(
    "/api/capa/{capa_id}/approve",
    response_model=CapaOut,
    summary="Approve CAPA, close investigation, and trigger closed-loop Knowledge Capture",
    dependencies=[Depends(require_reviewer)],
)
async def approve_capa(
    capa_id: uuid.UUID,
    req: CapaApproveRequest,
    current_user: CurrentUser,
    db: DbDep,
) -> CapaOut:
    """Commit the CAPA as approved.

    Closes the investigation and captures the learnings for future RAG retrieval.
    """
    if not req.approved:
        # If rejecting approval, just change status back to review/draft
        res = await service.update_capa(
            db=db,
            capa_id=capa_id,
            org_id=current_user.org_id,
            req=CapaUpdate(status="draft"),
            user_id=current_user.user_id,
        )
        return CapaOut.model_validate(res)

    res = await service.approve_capa(
        db=db,
        capa_id=capa_id,
        org_id=current_user.org_id,
        user_id=current_user.user_id,
        user_role=current_user.role,
    )
    return CapaOut.model_validate(res)


@router.get(
    "/api/investigations/{investigation_id}/summary",
    response_model=InvestigationSummaryOut,
    summary="Get an AI executive summary of the investigation",
)
async def summarize_investigation(
    investigation_id: uuid.UUID,
    current_user: CurrentUser,
    db: DbDep,
) -> InvestigationSummaryOut:
    res = await service.summarize_investigation(
        db=db,
        investigation_id=investigation_id,
        org_id=current_user.org_id,
        user_role=current_user.role,
    )
    return InvestigationSummaryOut.model_validate(res)


@router.get(
    "/api/ai-runtime/telemetry",
    summary="Get active AI runtime configuration and telemetry metrics",
)
async def get_ai_runtime_telemetry():
    from src.shared.config import settings
    from src.ai_runtime.observability import tracker
    from src.ai_runtime.adapters.inference_adapter import get_inference_adapter
    
    # Resolve the active adapter to query current configurations
    adapter = get_inference_adapter()
    active_model = adapter.get_model_name() if hasattr(adapter, "get_model_name") else getattr(adapter, "_model", "N/A")
    
    summary = tracker.get_summary()
    
    # Check fallback status: if the active model name is different from the preferred model config
    fallback_active = False
    preferred_model = settings.FIREWORKS_MODEL
    if settings.INFERENCE_PROVIDER == "fireworks" and active_model != preferred_model:
        fallback_active = True

    return {
        "provider": settings.INFERENCE_PROVIDER,
        "model": active_model,
        "preferred_model": preferred_model,
        "fallback_triggered": fallback_active,
        "health_status": "ok",
        "architecture": "Provider-Independent Adapter Chain (FastAPI -> AsyncOpenAI)",
        "total_calls": summary.get("total_calls", 0),
        "average_latency_ms": round(summary.get("average_latency_ms", 0.0), 2),
        "total_cost_usd": round(summary.get("total_cost_usd", 0.0), 5),
    }

@router.get(
    "/api/v1/runtime/providers",
    summary="Get runtime providers status",
)
async def get_runtime_providers():
    """
    Returns the status of the runtime providers (e.g., Knowledge, Inference).
    """
    return {
        "provider": "Knowledge Runtime",
        "status": "Ready",
        "fallbacks": [
            "Fireworks",
            "Local Runtime"
        ]
    }
