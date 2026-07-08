"""Knowledge domain router: documents and semantic search."""
from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.dependencies import CurrentUser, get_db
from src.knowledge import service
from src.knowledge.schemas import (
    DocumentCreate,
    DocumentListOut,
    DocumentOut,
    SearchRequest,
    SearchResponse,
)

router = APIRouter(prefix="/api/documents", tags=["Knowledge Documents"])
search_router = APIRouter(prefix="/api", tags=["Semantic Search"])
DbDep = Annotated[AsyncSession, Depends(get_db)]


@router.post(
    "",
    response_model=DocumentOut,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a knowledge document",
)
async def create_document(
    current_user: CurrentUser,
    db: DbDep,
    file: UploadFile = File(...),
    title: str = Form(...),
    doc_type: str = Form(default="general"),
) -> DocumentOut:
    req = DocumentCreate(title=title, doc_type=doc_type)  # type: ignore[arg-type]
    return await service.upload_document(db, file, req, current_user.org_id, current_user.user_id)


@router.get("", response_model=DocumentListOut, summary="List knowledge documents")
async def list_documents(
    current_user: CurrentUser,
    db: DbDep,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    doc_type: str | None = Query(None),
) -> DocumentListOut:
    return await service.list_documents(db, current_user.org_id, page, page_size, doc_type)


@router.get("/{doc_id}", response_model=DocumentOut, summary="Get document by ID")
async def get_document(
    doc_id: uuid.UUID,
    current_user: CurrentUser,
    db: DbDep,
) -> DocumentOut:
    return await service.get_document(db, doc_id, current_user.org_id)


@router.delete(
    "/{doc_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete document from knowledge base",
)
async def delete_document(
    doc_id: uuid.UUID,
    current_user: CurrentUser,
    db: DbDep,
) -> None:
    await service.delete_document(db, doc_id, current_user.org_id, current_user.user_id)


@search_router.post(
    "/search",
    response_model=SearchResponse,
    summary="Semantic search across evidence and knowledge base",
)
async def semantic_search(
    req: SearchRequest,
    current_user: CurrentUser,
    db: DbDep,
) -> SearchResponse:
    """Perform cosine similarity search using pgvector embeddings."""
    return await service.semantic_search(db, req, current_user.org_id)
