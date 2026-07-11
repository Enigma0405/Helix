"""Main entrypoint for Project Helix FastAPI backend."""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware

from src.ai_runtime.router import router as ai_router
from src.assets.router import router as assets_router
from src.auth.router import router as auth_router
from src.shared.config import settings
from src.database.core import create_all_tables
from src.storage.minio_provider import ensure_buckets
from src.evidence.router import inv_evidence_router, router as evidence_router
from src.export.router import router as export_router
from src.investigation.router import (
    comments_router,
    router as investigations_router,
    tasks_patch_router,
    tasks_router,
)
from src.knowledge.router import router as documents_router, search_router

# Setup basic logging
logging.basicConfig(
    level=logging.INFO if not settings.DEBUG else logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("helix.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """ lifespan event handler to setup database schema and MinIO buckets."""
    logger.info("Initializing application startup sequence...")
    try:
        # Enable pgvector and create tables
        from sqlalchemy import text
        from src.database.core import engine
        if not str(engine.url).startswith("sqlite"):
            async with engine.begin() as conn:
                await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
                await conn.execute(text("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"))
        await create_all_tables()
        logger.info("Database schema initialized.")
        await ensure_buckets()
        logger.info("MinIO buckets initialized successfully.")
    except Exception as e:
        logger.error("Failed to initialize MinIO buckets: %s", e, exc_info=True)
    yield
    logger.info("Application shutting down...")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    debug=settings.DEBUG,
    lifespan=lifespan,
)

# ── CORS Middleware ──────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Router Registration ──────────────────────────────────────────────────────
# Auth routes
app.include_router(auth_router)

# Investigations lifecycle routes
app.include_router(investigations_router)
app.include_router(comments_router)
app.include_router(tasks_router)
app.include_router(tasks_patch_router)

# Evidence routes
app.include_router(evidence_router)
app.include_router(inv_evidence_router)

# Knowledge Documents and Semantic Search routes
app.include_router(documents_router)
app.include_router(search_router)

# Assets router
app.include_router(assets_router)

# AI Runtime workflows
app.include_router(ai_router)

# Export operations
app.include_router(export_router)


# ── Health Endpoint ─────────────────────────────────────────────────────────
@app.get("/api/health", status_code=status.HTTP_200_OK, tags=["Health"])
async def health_check() -> dict[str, str]:
    """Basic health check endpoint."""
    return {"status": "healthy", "service": settings.APP_NAME, "version": settings.APP_VERSION}
