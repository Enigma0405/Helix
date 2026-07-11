"""Export router: handles trigger of PDF exports and retrieval of presigned download links."""
from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.dependencies import CurrentUser, RoleChecker, get_db
from src.export import service
from src.export.schemas import ExportCreate, ExportOut

router = APIRouter(tags=["Document Export"])
DbDep = Annotated[AsyncSession, Depends(get_db)]

require_analyst = RoleChecker(["admin", "analyst"])


@router.post(
    "/api/investigations/{investigation_id}/export",
    response_model=ExportOut,
    status_code=status.HTTP_201_CREATED,
    summary="Generate PDF report of investigation findings",
    dependencies=[Depends(require_analyst)],
)
async def generate_export(
    investigation_id: uuid.UUID,
    req: ExportCreate,
    current_user: CurrentUser,
    db: DbDep,
) -> ExportOut:
    """Generate PDF report and save it to storage. Return record with key."""
    # We ignore req.format since only PDF is supported in MVP
    res = await service.generate_pdf_report(
        db=db,
        investigation_id=investigation_id,
        org_id=current_user.org_id,
        user_id=current_user.user_id,
    )
    return ExportOut.model_validate(res)


@router.get(
    "/api/exports/{export_id}",
    response_model=ExportOut,
    summary="Retrieve export metadata and presigned download URL",
)
async def get_export(
    export_id: uuid.UUID,
    current_user: CurrentUser,
    db: DbDep,
) -> ExportOut:
    """Get export record with a freshly generated temporary presigned download URL."""
    export_record, download_url = await service.get_export_with_url(
        db=db,
        export_id=export_id,
        org_id=current_user.org_id,
    )
    # Pack the URL directly inside output schema
    out = ExportOut.model_validate(export_record)
    out.download_url = download_url
    return out
