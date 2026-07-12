"""Core configuration via Pydantic BaseSettings."""
from __future__ import annotations

from functools import lru_cache
from typing import Any, Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables or .env file."""

    model_config = SettingsConfigDict(
        env_file=["../.env", ".env"],
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Application ──────────────────────────────────────────────────────────
    APP_NAME: str = "Project Helix"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False
    ENVIRONMENT: Literal["development", "staging", "production"] = "development"

    # ── Database ──────────────────────────────────────────────────────────────
    DATABASE_URL: str = Field(
        default="postgresql+psycopg://helix:helix@localhost:5432/helix",
        description="Async psycopg3 connection string (must start with postgresql+psycopg://)",
    )
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20
    DB_ECHO: bool = False

    @field_validator("DATABASE_URL")
    @classmethod
    def validate_db_url(cls, v: str) -> str:
        # Programmatically map postgresql:// or postgres:// to postgresql+psycopg:// for async compatibility
        if v.startswith("postgresql://"):
            v = v.replace("postgresql://", "postgresql+psycopg://", 1)
        elif v.startswith("postgres://"):
            v = v.replace("postgres://", "postgresql+psycopg://", 1)
            
        if not (v.startswith("postgresql+psycopg://") or v.startswith("sqlite+aiosqlite://")):
            raise ValueError(
                "DATABASE_URL must start with 'postgresql+psycopg://' (psycopg v3 driver) or 'sqlite+aiosqlite://' for local testing"
            )
        return v

    # ── JWT Security ──────────────────────────────────────────────────────────
    SECRET_KEY: str = Field(
        default="changeme-in-production-use-a-32-char-secret",
        description="JWT signing key — override in production",
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # ── MinIO / Object Storage ────────────────────────────────────────────────
    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin"
    MINIO_SECURE: bool = False
    MINIO_BUCKET_EVIDENCE: str = "helix-evidence"
    MINIO_BUCKET_DOCUMENTS: str = "helix-documents"
    MINIO_BUCKET_EXPORTS: str = "helix-exports"

    # ── Redis ─────────────────────────────────────────────────────────────────
    REDIS_URL: str = "redis://localhost:6379/0"

    # ── AI / Inference ────────────────────────────────────────────────────────
    INFERENCE_PROVIDER: Literal["fireworks", "openai", "local", "mock"] = "mock"
    FIREWORKS_API_KEY: str = Field(default="", description="Fireworks AI API key")
    FIREWORKS_BASE_URL: str = "https://api.fireworks.ai/inference/v1"
    # Gemma 4 31B IT — production demo model running on AMD Instinct MI300X via Fireworks AI
    FIREWORKS_MODEL: str = "accounts/fireworks/models/gemma-4-31b-it"
    OPENAI_API_KEY: str = Field(default="", description="OpenAI API key")
    OPENAI_MODEL: str = "gpt-4o-mini"
    LOCAL_OLLAMA_URL: str = "http://localhost:11434/v1"
    LOCAL_MODEL: str = "llama3.2"

    # ── Embeddings ────────────────────────────────────────────────────────────
    EMBEDDING_PROVIDER: Literal["local", "fireworks"] = "local"
    EMBEDDING_MODEL_LOCAL: str = "all-MiniLM-L6-v2"
    EMBEDDING_MODEL_FIREWORKS: str = "nomic-ai/nomic-embed-text-v1.5"
    EMBEDDING_DIM: int = 384  # 384 for all-MiniLM-L6-v2; 768 for nomic-embed

    # ── CORS ──────────────────────────────────────────────────────────────────
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def validate_cors_origins(cls, v: Any) -> list[str]:
        if isinstance(v, str):
            v = v.strip()
            if not v:
                return []
            if v.startswith("[") and v.endswith("]"):
                import json
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [x.strip() for x in v.split(",") if x.strip()]
        return v

    # ── Chunking ──────────────────────────────────────────────────────────────
    CHUNK_SIZE: int = 512
    CHUNK_OVERLAP: int = 64

    # ── Audit ─────────────────────────────────────────────────────────────────
    AUDIT_ENABLED: bool = True

    # ── Ingestion / Organization Memory ───────────────────────────────────────
    ORGANIZATION_MEMORY_DIR: str = Field(
        default="../../organization_memory",
        description="Path to the root of the organization memory repository",
    )


@lru_cache
def get_settings() -> Settings:
    """Return cached settings instance."""
    return Settings()


settings = get_settings()
