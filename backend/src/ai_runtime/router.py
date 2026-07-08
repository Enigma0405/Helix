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
)
from src.core.dependencies import CurrentUser, RoleChecker, get_db

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
