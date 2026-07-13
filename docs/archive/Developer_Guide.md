# Developer Guide — Project Helix EvidenceOps Platform

> **Audience:** Engineers contributing to or extending Project Helix
> **Version:** RC2 | **Last Updated:** 2026-07-08

---

## 1. Local Development Setup (Without Docker)

Running services directly on your machine provides faster iteration cycles.

### 1.1 Prerequisites

- Python 3.11+
- Node.js 20+ and npm
- PostgreSQL 17 with pgvector extension
- Redis 7
- MinIO (or any S3-compatible server)

### 1.2 Backend Setup

```bash
# Clone the repo
git clone https://github.com/your-org/project-helix.git
cd "Project Helix"

# Create virtual environment
python -m venv .venv
source .venv/bin/activate      # Linux/Mac
.venv\Scripts\activate         # Windows PowerShell

# Install backend dependencies
pip install -r backend/requirements.txt

# Configure environment
cp .env.example .env
# Edit .env: set DATABASE_URL, REDIS_URL, MINIO_ENDPOINT to your local services
# Set JWT_SECRET_KEY to any random string for local dev

# Run database migrations (creates all tables)
cd backend
python -m alembic upgrade head   # if alembic is configured
# OR: Let FastAPI auto-create on startup (development mode)

# Start the backend
uvicorn src.main:app --reload --port 8000 --app-dir backend
```

The backend will be available at: http://localhost:8000
API docs: http://localhost:8000/docs

### 1.3 Frontend Setup

```bash
cd frontend
npm install
npm run dev    # Starts Vite dev server on http://localhost:3000
```

> In development mode, the frontend's `REACT_APP_API_URL` should point to `http://localhost:8000`.
> Edit `frontend/.env.local`:
> ```
> VITE_API_URL=http://localhost:8000
> ```

### 1.4 External Services (Local)

```bash
# PostgreSQL with pgvector (if not already running):
docker run -d --name helix_dev_db \
  -e POSTGRES_USER=helix -e POSTGRES_PASSWORD=devpassword -e POSTGRES_DB=helixdb \
  -p 5432:5432 pgvector/pgvector:pg17

# Redis:
docker run -d --name helix_dev_redis -p 6379:6379 redis:7-alpine

# MinIO:
docker run -d --name helix_dev_minio \
  -e MINIO_ROOT_USER=minioadmin -e MINIO_ROOT_PASSWORD=devpassword \
  -p 9000:9000 -p 9001:9001 quay.io/minio/minio server /data --console-address :9001
```

---

## 2. Running Tests

### 2.1 Unit + Integration Tests

```bash
cd backend
pip install pytest pytest-asyncio httpx

# Run all tests
pytest tests/ -v

# Run with coverage
pytest tests/ -v --cov=src --cov-report=term-missing

# Run a specific test file
pytest tests/test_inference_adapter.py -v

# Run tests in parallel (requires pytest-xdist)
pytest tests/ -n 4
```

**Test configuration:** `backend/pyproject.toml` contains pytest settings.
Tests use `INFERENCE_PROVIDER=mock` by default (no external API calls).

### 2.2 Evaluation Framework

The evaluation framework validates AI output quality against golden test cases:

```bash
# Full evaluation run (requires running system):
pip install httpx rich
python evaluation/run_evaluation.py --api-url http://localhost/api

# Run only specific metric categories:
python evaluation/run_evaluation.py --metrics retrieval citation grounding

# Compare providers:
python evaluation/run_evaluation.py --compare-providers mock fireworks
```

**Metric targets (must all pass before a PR is merged):**

| Metric | Target | Red Line |
|---|---|---|
| Retrieval Recall@5 | ≥ 0.80 | < 0.70 |
| Citation Precision | ≥ 0.90 | < 0.80 |
| Grounding Score | ≥ 0.80 | < 0.70 |
| Hallucination Rate | ≤ 0.10 | > 0.20 |
| Hypothesis Latency p95 | ≤ 10,000 ms | > 20,000 ms |

### 2.3 12/12 Functional Tests (RC1 Baseline)

The functional test suite validates all platform capabilities end-to-end:

```bash
python scripts/verify_system.py --api-url http://localhost/api
```

Expected: `12/12 tests passing` ✅

---

## 3. Adding a New Domain Service

Helix uses a **modular monolith** pattern. Each domain is a self-contained Python package under `src/`.

### 3.1 Domain Package Structure

```
src/my_new_domain/
├── __init__.py
├── models.py       # SQLAlchemy ORM models
├── schemas.py      # Pydantic request/response schemas
├── service.py      # Business logic (no HTTP; called by router)
└── router.py       # FastAPI router (HTTP boundary)
```

### 3.2 Step-by-Step

**Step 1: Create the domain package**
```bash
mkdir backend/src/my_new_domain
touch backend/src/my_new_domain/__init__.py
```

**Step 2: Define the ORM model (`models.py`)**
```python
import uuid
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from src.core.database import Base

class MyEntity(Base):
    __tablename__ = "my_entities"

    id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), index=True)  # ← REQUIRED
    name: Mapped[str]
```

> ⚠️ **Every model must have `org_id`.** This is how multi-tenant isolation is enforced.

**Step 3: Define Pydantic schemas (`schemas.py`)**
```python
from pydantic import BaseModel
import uuid

class MyEntityCreate(BaseModel):
    name: str

class MyEntityResponse(BaseModel):
    id: uuid.UUID
    name: str
    model_config = {"from_attributes": True}
```

**Step 4: Implement business logic (`service.py`)**
```python
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.core.dependencies import _CurrentUserPayload

async def create_entity(data: MyEntityCreate, user: _CurrentUserPayload, db: AsyncSession):
    entity = MyEntity(org_id=user.org_id, name=data.name)
    db.add(entity)
    await db.commit()
    await db.refresh(entity)
    # Write audit event
    from src.core.audit import write_audit
    await write_audit(entity_type="my_entity", action="create",
                      entity_id=entity.id, actor_id=user.user_id,
                      org_id=user.org_id, db=db)
    return entity
```

**Step 5: Create the FastAPI router (`router.py`)**
```python
from fastapi import APIRouter, Depends
from src.core.dependencies import get_db, CurrentUser, RoleChecker

router = APIRouter(
    prefix="/my-entities",
    tags=["My Domain"],
    dependencies=[Depends(RoleChecker(["analyst", "manager", "admin"]))],
)

@router.post("/", response_model=MyEntityResponse)
async def create(
    data: MyEntityCreate,
    current_user: CurrentUser,
    db = Depends(get_db),
):
    return await create_entity(data, current_user, db)
```

**Step 6: Register in `main.py`**
```python
# backend/src/main.py
from src.my_new_domain.router import router as my_domain_router

app.include_router(my_domain_router, prefix="/api")
```

**Step 7: Add golden test cases**
```bash
# evaluation/golden_cases/my_domain_cases.json
# Add at least 3 test cases before merging
```

---

## 4. Adding a New Inference Provider

The `InferenceAdapter` protocol makes this straightforward.

### 4.1 Implement the Protocol

```python
# backend/src/ai_runtime/adapters/inference_adapter.py

class MyNewProviderAdapter:
    """Inference via My New Provider."""

    def __init__(self) -> None:
        from src.core.config import settings
        self._model = settings.MY_PROVIDER_MODEL
        self._api_key = settings.MY_PROVIDER_API_KEY
        # Initialize your client here

    async def complete(
        self,
        messages: list[dict],
        temperature: float = 0.2,
        max_tokens: int = 2048,
        **kwargs,
    ) -> str:
        # Call your provider's API
        # Return the generated text as a string
        ...

    def get_model_name(self) -> str:
        return self._model
```

### 4.2 Register in the Factory

```python
# In get_inference_adapter():
elif provider == "my_provider":
    adapter = MyNewProviderAdapter()
```

### 4.3 Add Config Keys

```python
# backend/src/core/config.py
MY_PROVIDER_API_KEY: str = ""
MY_PROVIDER_MODEL: str = "my-model-id"
MY_PROVIDER_BASE_URL: str = "https://api.myprovider.ai/v1"
```

```bash
# .env.example (document the new provider):
MY_PROVIDER_API_KEY=
MY_PROVIDER_MODEL=my-model-id
```

### 4.4 Write Tests

```python
# backend/tests/test_my_provider_adapter.py
async def test_my_provider_completes():
    adapter = MyNewProviderAdapter()
    result = await adapter.complete([{"role": "user", "content": "Hello"}])
    assert isinstance(result, str)
    assert len(result) > 0
```

That's it. Switching to the new provider: `INFERENCE_PROVIDER=my_provider` in `.env`.

---

## 5. Environment Variable Reference

All configuration is in `backend/src/core/config.py` as a `pydantic_settings.BaseSettings` class.
Every variable can be overridden via the `.env` file.

### 5.1 Database

| Variable | Default | Description |
|---|---|---|
| `POSTGRES_USER` | `helix` | PostgreSQL username |
| `POSTGRES_PASSWORD` | `change_me` | PostgreSQL password |
| `POSTGRES_DB` | `helixdb` | Database name |
| `DATABASE_URL` | (constructed) | Full async connection URL |

### 5.2 AI Runtime

| Variable | Default | Options | Description |
|---|---|---|---|
| `INFERENCE_PROVIDER` | `mock` | `mock`, `fireworks`, `openai`, `local` | Active inference provider |
| `FIREWORKS_API_KEY` | `""` | — | Fireworks AI API key |
| `FIREWORKS_MODEL` | `accounts/fireworks/models/gemma4-31b-it` | — | Model identifier |
| `FIREWORKS_BASE_URL` | `https://api.fireworks.ai/inference/v1` | — | Fireworks API base URL |
| `OPENAI_API_KEY` | `""` | — | OpenAI API key |
| `OPENAI_MODEL` | `gpt-4o` | — | OpenAI model |
| `LOCAL_INFERENCE_URL` | `http://localhost:11434/api` | — | Ollama API URL |
| `EMBEDDING_MODEL` | `local` | `local`, `fireworks` | Embedding provider |
| `EMBEDDING_DIMENSION` | `384` | 384 (local), 768 (fireworks) | Vector dimension |

### 5.3 Application

| Variable | Default | Description |
|---|---|---|
| `JWT_SECRET_KEY` | (required) | HMAC signing secret — generate with `secrets.token_hex(32)` |
| `JWT_ALGORITHM` | `HS256` | JWT algorithm (`HS256` or `RS256`) |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | `60` | Access token lifetime |
| `JWT_REFRESH_TOKEN_EXPIRE_DAYS` | `7` | Refresh token lifetime |
| `ENVIRONMENT` | `development` | `development` or `production` |
| `LOG_LEVEL` | `INFO` | Python logging level |
| `MAX_REQUESTS_PER_MINUTE` | `60` | Rate limiting per IP |
| `MAX_EVIDENCE_FILE_SIZE_MB` | `50` | Maximum evidence upload size |
| `CHUNK_SIZE` | `512` | Document chunking token size |
| `CHUNK_OVERLAP` | `64` | Chunk overlap tokens |
| `AUDIT_ENABLED` | `true` | Toggle audit logging |

### 5.4 MinIO / Storage

| Variable | Default | Description |
|---|---|---|
| `MINIO_ROOT_USER` | `minioadmin` | MinIO admin username |
| `MINIO_ROOT_PASSWORD` | `change_me` | MinIO admin password |
| `MINIO_ENDPOINT` | `localhost:9000` | MinIO S3 API endpoint |
| `MINIO_SECURE` | `false` | Use HTTPS for MinIO |
| `MINIO_EVIDENCE_BUCKET` | `helix-evidence` | Evidence file bucket |
| `MINIO_DOCUMENTS_BUCKET` | `helix-documents` | Processed documents bucket |
| `MINIO_EXPORTS_BUCKET` | `helix-exports` | PDF export bucket |

---

## 6. Code Style and Linting

### 6.1 Python (Backend)

The project uses `ruff` for linting and formatting, configured in `backend/pyproject.toml`:

```bash
# Lint (check for issues):
cd backend
ruff check src/ tests/

# Format (auto-fix style):
ruff format src/ tests/

# Type checking:
mypy src/ --ignore-missing-imports
```

**Key style rules:**
- Type annotations required on all function signatures
- Docstrings required on all public classes and functions
- `async/await` everywhere — no `requests` library (use `httpx.AsyncClient`)
- All new models must have `org_id` field (multi-tenancy requirement)
- All new routes must write an audit event on create/update/delete

### 6.2 Python Import Style

```python
# Standard library first
import uuid
from datetime import datetime

# Third-party second
from fastapi import Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

# Local last
from src.core.dependencies import CurrentUser
from src.core.audit import write_audit
```

### 6.3 Frontend (TypeScript)

```bash
cd frontend
npm run lint     # ESLint
npm run format   # Prettier
npm run type-check   # TypeScript compiler
```

### 6.4 Pre-Commit Checklist

Before opening a pull request:
- [ ] `ruff check src/` passes (zero errors)
- [ ] `pytest tests/` — all tests pass
- [ ] `python evaluation/run_evaluation.py` — all metrics above threshold
- [ ] New AI features have golden test cases in `evaluation/golden_cases/`
- [ ] `docs/api.md` updated if any API endpoints changed
- [ ] `AUDIT_ENABLED=true` in your test environment (audit writes verified)

---

## 7. Key Engineering Principles

All code in Helix follows these invariants. Reviewers will reject PRs that violate them:

| Principle | Invariant |
|---|---|
| **Evidence-First** | Every AI claim traceable to a retrieved source chunk |
| **Human-in-Loop** | No CAPA takes effect without a `manager`/`admin` approval event |
| **Tenant Isolation** | Every DB query includes `WHERE org_id = current_user.org_id` |
| **Adapter Pattern** | No code may import a specific LLM client directly — only via adapter |
| **Async All the Way** | No synchronous I/O in request path; use `async/await` throughout |
| **Audit Everything** | Every create/update/delete/approve writes to `audit_logs` |
| **Zero Raw Tracebacks** | All exceptions caught; structured `{"detail": "..."}` responses only |
| **Test Before Ship** | No feature merged without a test case and a metric |

---

*Maintained in `docs/Developer_Guide.md`. Update alongside code changes.*
