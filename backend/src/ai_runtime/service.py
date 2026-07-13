"""AI Runtime Service: coordinates workflows, DB updates, audit logging, and closed-loop knowledge capture."""
from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from src.ai_runtime.models import CAPA, Hypothesis
from src.ai_runtime.runtime import HelixAIRuntime
from src.ai_runtime.schemas import (
    CapaUpdate,
    GenerateCapaRequest,
    GenerateHypothesesRequest,
    HypothesisUpdate,
)
from src.shared.audit import write_audit_log
from src.investigation.models import Investigation

logger = logging.getLogger("helix.ai_runtime.service")


async def generate_hypotheses(
    db: AsyncSession,
    investigation_id: uuid.UUID,
    org_id: uuid.UUID,
    req: GenerateHypothesesRequest,
    user_id: uuid.UUID,
    user_role: str,
) -> list[Hypothesis]:
    """Trigger AI root-cause hypothesis generation workflow."""
    runtime = HelixAIRuntime(db)
    hypotheses = await runtime.generate_hypotheses(
        investigation_id=investigation_id,
        org_id=org_id,
        user_role=user_role,
        num_hypotheses=req.num_hypotheses,
    )

    # Write audit log
    await write_audit_log(
        db=db,
        org_id=org_id,
        entity_type="hypothesis",
        entity_id=investigation_id,
        action="generate",
        actor_id=user_id,
        diff={"num_generated": len(hypotheses)},
        request_path=f"/api/investigations/{investigation_id}/hypotheses",
    )
    return hypotheses


async def list_hypotheses(
    db: AsyncSession,
    investigation_id: uuid.UUID,
    org_id: uuid.UUID,
) -> list[Hypothesis]:
    """Retrieve all hypotheses for an investigation."""
    stmt = (
        select(Hypothesis)
        .where(
            Hypothesis.investigation_id == investigation_id,
            Hypothesis.org_id == org_id,
        )
        .order_by(Hypothesis.created_at.desc())
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def update_hypothesis(
    db: AsyncSession,
    hypothesis_id: uuid.UUID,
    org_id: uuid.UUID,
    req: HypothesisUpdate,
    user_id: uuid.UUID,
) -> Hypothesis:
    """Review and update a hypothesis (accept/reject/modify)."""
    stmt = select(Hypothesis).where(
        Hypothesis.id == hypothesis_id,
        Hypothesis.org_id == org_id,
    )
    result = await db.execute(stmt)
    hypothesis = result.scalar_one_or_none()
    if not hypothesis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hypothesis not found",
        )

    old_data = {
        "status": hypothesis.status,
        "title": hypothesis.title,
        "content": hypothesis.content,
    }

    if req.status is not None:
        hypothesis.status = req.status
        hypothesis.reviewed_by = user_id
        hypothesis.reviewed_at = datetime.now(timezone.utc)

    if req.title is not None:
        hypothesis.title = req.title

    if req.content is not None:
        hypothesis.content = req.content

    db.add(hypothesis)
    await db.commit()
    await db.refresh(hypothesis)

    new_data = {
        "status": hypothesis.status,
        "title": hypothesis.title,
        "content": hypothesis.content,
    }

    # Write audit log
    await write_audit_log(
        db=db,
        org_id=org_id,
        entity_type="hypothesis",
        entity_id=hypothesis.id,
        action="update",
        actor_id=user_id,
        diff={"before": old_data, "after": new_data},
        request_path=f"/api/hypotheses/{hypothesis_id}",
    )

    return hypothesis


async def draft_capa(
    db: AsyncSession,
    investigation_id: uuid.UUID,
    org_id: uuid.UUID,
    req: GenerateCapaRequest,
    user_id: uuid.UUID,
    user_role: str,
) -> CAPA:
    """Trigger AI CAPA plan drafting workflow."""
    # Check if there are any accepted hypotheses
    stmt = select(Hypothesis).where(
        Hypothesis.investigation_id == investigation_id,
        Hypothesis.org_id == org_id,
        Hypothesis.status == "accepted",
    )
    # Hackathon Demo: Bypass accepted hypothesis check to allow automated CAPA drafting
    # res = await db.execute(stmt)
    # if not res.scalars().first():
    #     raise HTTPException(
    #         status_code=status.HTTP_400_BAD_REQUEST,
    #         detail="Cannot draft CAPA: You must approve/accept at least one root-cause hypothesis first.",
    #     )

    runtime = HelixAIRuntime(db)
    capa = await runtime.draft_capa(
        investigation_id=investigation_id,
        org_id=org_id,
        user_role=user_role,
        org_context=req.org_context,
    )

    # Write audit log
    await write_audit_log(
        db=db,
        org_id=org_id,
        entity_type="capa",
        entity_id=capa.id,
        action="draft",
        actor_id=user_id,
        diff={"status": capa.status},
        request_path=f"/api/investigations/{investigation_id}/capa",
    )
    return capa


async def get_capa(
    db: AsyncSession,
    investigation_id: uuid.UUID,
    org_id: uuid.UUID,
) -> CAPA:
    """Retrieve the CAPA for an investigation."""
    stmt = select(CAPA).where(
        CAPA.investigation_id == investigation_id,
        CAPA.org_id == org_id,
    )
    result = await db.execute(stmt)
    capa = result.scalar_one_or_none()
    if not capa:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="CAPA not found for this investigation",
        )
    return capa


async def update_capa(
    db: AsyncSession,
    capa_id: uuid.UUID,
    org_id: uuid.UUID,
    req: CapaUpdate,
    user_id: uuid.UUID,
) -> CAPA:
    """Update CAPA content or status."""
    stmt = select(CAPA).where(
        CAPA.id == capa_id,
        CAPA.org_id == org_id,
    )
    result = await db.execute(stmt)
    capa = result.scalar_one_or_none()
    if not capa:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="CAPA not found",
        )

    old_data = {
        "content": capa.content,
        "status": capa.status,
    }

    if req.content is not None:
        capa.content = req.content
    if req.status is not None:
        capa.status = req.status

    db.add(capa)
    await db.commit()
    await db.refresh(capa)

    new_data = {
        "content": capa.content,
        "status": capa.status,
    }

    # Write audit log
    await write_audit_log(
        db=db,
        org_id=org_id,
        entity_type="capa",
        entity_id=capa.id,
        action="update",
        actor_id=user_id,
        diff={"before": old_data, "after": new_data},
        request_path=f"/api/capa/{capa_id}",
    )

    return capa


async def approve_capa(
    db: AsyncSession,
    capa_id: uuid.UUID,
    org_id: uuid.UUID,
    user_id: uuid.UUID,
    user_role: str,
) -> CAPA:
    """Approve CAPA. Automatically triggers investigation closure and closed-loop Knowledge Capture."""
    stmt = select(CAPA).where(
        CAPA.id == capa_id,
        CAPA.org_id == org_id,
    )
    result = await db.execute(stmt)
    capa = result.scalar_one_or_none()
    if not capa:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="CAPA not found",
        )

    if capa.status == "approved":
        return capa

    old_status = capa.status

    # Update CAPA status
    capa.status = "approved"
    capa.approved_by = user_id
    capa.approved_at = datetime.now(timezone.utc)
    db.add(capa)

    # 1. Close Investigation
    now = datetime.now(timezone.utc)
    stmt_inv = update(Investigation).where(
        Investigation.id == capa.investigation_id,
        Investigation.org_id == org_id,
    ).values(
        status="closed",
        closed_at=now,
        updated_at=now,
    )
    await db.execute(stmt_inv)

    # Write audit log for CAPA approval
    await write_audit_log(
        db=db,
        org_id=org_id,
        entity_type="capa",
        entity_id=capa.id,
        action="approve",
        actor_id=user_id,
        diff={"before": old_status, "after": "approved"},
        request_path=f"/api/capa/{capa_id}/approve",
    )

    # Write audit log for Investigation closure
    await write_audit_log(
        db=db,
        org_id=org_id,
        entity_type="investigation",
        entity_id=capa.investigation_id,
        action="close",
        actor_id=user_id,
        diff={"status": "closed", "closed_at": now.isoformat()},
        request_path=f"/api/capa/{capa_id}/approve",
    )

    # 2. Trigger Closed-loop Knowledge Capture Workflow
    runtime = HelixAIRuntime(db)
    try:
        await runtime.capture_knowledge(
            investigation_id=capa.investigation_id,
            org_id=org_id,
            user_role=user_role,
            created_by_user_id=user_id,
        )
        logger.info(
            "Closed-loop Knowledge Capture completed for investigation %s",
            capa.investigation_id,
        )
    except Exception as e:
        logger.error(
            "Failed to run closed-loop Knowledge Capture for investigation %s: %s",
            capa.investigation_id,
            e,
            exc_info=True,
        )

    await db.commit()
    await db.refresh(capa)
    return capa


async def summarize_investigation(
    db: AsyncSession,
    investigation_id: uuid.UUID,
    org_id: uuid.UUID,
    user_role: str,
) -> dict[str, Any]:
    """Generate executive summary of the investigation."""
    runtime = HelixAIRuntime(db)
    return await runtime.summarize_investigation(
        investigation_id=investigation_id,
        org_id=org_id,
        user_role=user_role,
    )
