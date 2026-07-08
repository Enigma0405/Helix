"""Evidence domain router: file upload, list, get, delete."""
from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.dependencies import CurrentUser, get_db
from src.evidence import service
from src.evidence.schemas import EvidenceListOut, EvidenceUploadOut
from src.knowledge.schemas import ChunkOut

router = APIRouter(prefix="/api/evidence", tags=["Evidence"])
DbDep = Annotated[AsyncSession, Depends(get_db)]

inv_evidence_router = APIRouter(prefix="/api/investigations", tags=["Evidence"])


@router.post(
    "/upload",
    response_model=EvidenceUploadOut,
    status_code=status.HTTP_201_CREATED,
    summary="Upload evidence file to an investigation",
)
async def upload_evidence(
    current_user: CurrentUser,
    db: DbDep,
    file: UploadFile = File(..., description="Evidence file (PDF, DOCX, CSV, TXT, image, email)"),
    investigation_id: uuid.UUID = Form(..., description="Target investigation UUID"),
) -> EvidenceUploadOut:
    """Upload a file as evidence. Triggers async processing pipeline."""
    return await service.upload_evidence(
        db,
        file,
        investigation_id,
        current_user.org_id,
        current_user.user_id,
    )


@inv_evidence_router.get(
    "/{investigation_id}/evidence",
    response_model=EvidenceListOut,
    summary="List all evidence for an investigation",
)
async def list_evidence(
    investigation_id: uuid.UUID,
    current_user: CurrentUser,
    db: DbDep,
) -> EvidenceListOut:
    return await service.list_evidence(db, investigation_id, current_user.org_id)


@router.get(
    "/{evidence_id}",
    response_model=EvidenceUploadOut,
    summary="Get a single evidence item",
)
async def get_evidence(
    evidence_id: uuid.UUID,
    current_user: CurrentUser,
    db: DbDep,
) -> EvidenceUploadOut:
    return await service.get_evidence(db, evidence_id, current_user.org_id)


@router.get(
    "/{evidence_id}/chunks",
    response_model=list[ChunkOut],
    summary="Get all semantic chunks for an evidence item",
)
async def get_evidence_chunks(
    evidence_id: uuid.UUID,
    current_user: CurrentUser,
    db: DbDep,
) -> list[ChunkOut]:
    res = await service.get_evidence_chunks(db, evidence_id, current_user.org_id)
    return [ChunkOut.model_validate(c) for c in res]


@router.delete(
    "/{evidence_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete evidence item and remove from storage",
)
async def delete_evidence(
    evidence_id: uuid.UUID,
    current_user: CurrentUser,
    db: DbDep,
) -> None:
    await service.delete_evidence(db, evidence_id, current_user.org_id, current_user.user_id)
