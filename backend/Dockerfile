FROM python:3.12-slim AS base

# ============================================================
# System dependencies
# ============================================================
# WeasyPrint: Pango/Cairo for PDF generation
# curl: health check endpoint probing
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpango-1.0-0 \
    libpangoft2-1.0-0 \
    libcairo2 \
    libgdk-pixbuf2.0-0 \
    libffi-dev \
    shared-mime-info \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY pyproject.toml .
RUN pip install --no-cache-dir -e .

# Copy application source
COPY src/ ./src/

# Copy Alembic migrations (if present)
COPY alembic/ ./alembic/ 2>/dev/null || true
COPY alembic.ini . 2>/dev/null || true

EXPOSE 8000

# Production server:
# - workers=1: sentence-transformers embedding model cannot be safely shared
#   across forked processes. Use EMBEDDING_PROVIDER=fireworks for multi-worker.
# - log-level info: structured logging
# - no --reload: development only flag, not safe in production
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1", "--log-level", "info"]
