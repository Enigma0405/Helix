# System Architecture — Project Helix EvidenceOps Platform

> **Version:** RC2 | **Classification:** Technical Reference
> **Last Updated:** 2026-07-08

---

## 1. What Is Project Helix?

Project Helix is an **EvidenceOps Platform** — a new category of enterprise software that operationalizes
evidence: ingesting unstructured documents, extracting structured knowledge via AI, and producing
human-reviewable, citation-grounded recommendations for regulated decision-making.

The current MVP demonstrates **CAPA Investigation Intelligence for Manufacturing**. An investigator
uploads raw evidence (SOPs, batch records, test reports, environmental monitoring data), and Helix
returns ranked root-cause hypotheses — each hypothesis backed by exact citations to source documents —
in under 5 minutes. Every AI output is human-approved before it has any operational effect.

**Core Philosophy:**
```
Evidence → Understanding → AI Assistance → Human Decision → Knowledge Capture → Org Learning
```

---

## 2. System Layers

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              PROJECT HELIX                                      │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                        PRESENTATION LAYER                               │   │
│  │   React 18 + TypeScript SPA                                             │   │
│  │   shadcn/ui components | Tailwind CSS | React Query for data fetching   │   │
│  │   Pages: Investigations | Evidence | Hypotheses | CAPA | Evaluation     │   │
│  └──────────────────────────────┬──────────────────────────────────────────┘   │
│                                 │ HTTP/REST via Nginx                           │
│  ┌──────────────────────────────▼──────────────────────────────────────────┐   │
│  │                        GATEWAY LAYER                                    │   │
│  │   Nginx Alpine reverse proxy                                            │   │
│  │   /api/* → FastAPI backend     /* → React SPA (static files)           │   │
│  │   Single host port: 80                                                  │   │
│  └──────────────────────────────┬──────────────────────────────────────────┘   │
│                                 │                                               │
│  ┌──────────────────────────────▼──────────────────────────────────────────┐   │
│  │                       APPLICATION LAYER                                 │   │
│  │   FastAPI 0.110+ (Python 3.11, async/await throughout)                  │   │
│  │                                                                         │   │
│  │   Domain Modules (each owns router + service + models + schemas):       │   │
│  │   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │   │
│  │   │   auth   │ │evidence  │ │investig- │ │knowledge │ │  export    │  │   │
│  │   │          │ │          │ │  ation   │ │          │ │            │  │   │
│  │   └──────────┘ └──────────┘ └──────────┘ └──────────┘ └────────────┘  │   │
│  │                                                                         │   │
│  │   Cross-Cutting: core/ (config, security, database, audit, storage)     │   │
│  └──┬─────────────────────────┬──────────────────────────────┬────────────┘   │
│     │                         │                              │                 │
│  ┌──▼──────────┐  ┌───────────▼──────────┐  ┌──────────────▼──────────────┐  │
│  │  AI RUNTIME │  │  DATA LAYER          │  │  OBJECT STORAGE             │  │
│  │  LAYER      │  │                      │  │                              │  │
│  │             │  │  PostgreSQL 17        │  │  MinIO (S3-compatible)      │  │
│  │  Inference  │  │  + pgvector ext.     │  │  Buckets:                   │  │
│  │  Adapter    │  │                      │  │  - helix-evidence            │  │
│  │  (protocol) │  │  Redis 7             │  │  - helix-documents           │  │
│  │             │  │  (cache / pub-sub)   │  │  - helix-exports             │  │
│  │  Workflows: │  │                      │  │                              │  │
│  │  hypothesis │  │  SQLAlchemy async    │  │                              │  │
│  │  capa       │  │  ORM with org_id     │  │                              │  │
│  │  knowledge  │  │  isolation           │  │                              │  │
│  └──┬──────────┘  └──────────────────────┘  └──────────────────────────────┘  │
│     │                                                                           │
│  ┌──▼──────────────────────────────────────────────────────────────────────┐   │
│  │                    INFERENCE PROVIDER LAYER                             │   │
│  │                                                                         │   │
│  │  mock ──────► deterministic responses (CI / demo without API key)       │   │
│  │  fireworks ──► Fireworks AI API ──► Gemma 4 31B ──► AMD Instinct MI300X │   │
│  │  openai ─────► OpenAI API ──► GPT-4o                                   │   │
│  │  local ──────► Ollama (localhost:11434) ──► any GGUF model              │   │
│  │                                                                         │   │
│  │  Switched via: INFERENCE_PROVIDER=<value>  (zero code changes)         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Service Inventory

| Service | Container | Image | Internal Port | External Port | Purpose |
|---|---|---|---|---|---|
| **Nginx** | `helix_nginx` | `nginx:alpine` | 80 | **80** | Reverse proxy, single entry point |
| **Backend** | `helix_backend` | Custom (Python 3.11) | 8000 | None | FastAPI application |
| **Frontend** | `helix_frontend` | Custom (Node 20 build) | 3000 | None | React SPA static files |
| **PostgreSQL** | `helix_db` | `pgvector/pgvector:pg17` | 5432 | None | Relational DB + vector search |
| **Redis** | `helix_redis` | `redis:7-alpine` | 6379 | None | Caching, pub/sub |
| **MinIO** | `helix_minio` | `quay.io/minio/minio` | 9000/9001 | 9000, 9001 | Object storage for evidence |

All services run on the `helix_net` Docker bridge network. Only Nginx (port 80) and MinIO console
(port 9001) are exposed on the host.

---

## 4. AI Runtime Architecture

The InferenceAdapter pattern is the architectural centerpiece. It enables complete hardware
independence: switching from a laptop CPU to AMD Instinct MI300X GPU clusters requires changing
exactly one environment variable.

### 4.1 Protocol Definition

```python
# backend/src/ai_runtime/adapters/inference_adapter.py

@runtime_checkable
class InferenceAdapter(Protocol):
    """All adapters must satisfy this protocol — no inheritance required."""

    async def complete(
        self,
        messages: list[dict],     # OpenAI-style message list
        temperature: float = 0.2,
        max_tokens: int = 2048,
        **kwargs,
    ) -> str:
        """Generate a chat completion and return the text."""
        ...

    def get_model_name(self) -> str:
        """Return model identifier (logged with every AI output)."""
        ...
```

### 4.2 Adapter Selection Flow

```
Application startup
       ↓
get_inference_adapter() reads INFERENCE_PROVIDER from env
       ↓
  ┌────┴──────────────────────────────────────────────────────────┐
  │  "mock"      → MockAdapter     (deterministic, no network)    │
  │  "fireworks" → FireworksAdapter (Fireworks AI → AMD MI300X)   │
  │  "openai"    → OpenAIAdapter   (OpenAI GPT-4o)                │
  │  "local"     → LocalAdapter    (Ollama, localhost:11434)       │
  └───────────────────────────────────────────────────────────────┘
       ↓
Adapter cached in _adapter_cache dict (singleton per provider)
       ↓
All workflows call adapter.complete(messages) — provider-agnostic
```

### 4.3 FireworksAdapter (AMD Path)

```python
class FireworksAdapter:
    """Routes inference through Fireworks AI to Gemma 4 31B on AMD MI300X."""

    def __init__(self) -> None:
        from openai import AsyncOpenAI
        self._model = settings.FIREWORKS_MODEL
        self._client = AsyncOpenAI(
            api_key=settings.FIREWORKS_API_KEY,
            base_url=settings.FIREWORKS_BASE_URL,  # https://api.fireworks.ai/inference/v1
        )

    async def complete(self, messages: list[dict], ...) -> str:
        response = await self._client.chat.completions.create(
            model=self._model,   # "accounts/fireworks/models/gemma4-31b-it"
            messages=messages,
            ...
        )
        return response.choices[0].message.content
```

The FireworksAdapter uses the OpenAI-compatible `AsyncOpenAI` client pointed at the Fireworks base URL.
This is intentional: it keeps the client library standard and makes it trivial to swap in other
OpenAI-compatible providers.

### 4.4 Embedding Architecture

```
EMBEDDING_MODEL=local    →  sentence-transformers/all-MiniLM-L6-v2 (384 dims, runs in container)
EMBEDDING_MODEL=fireworks →  nomic-ai/nomic-embed-text-v1.5 via Fireworks API (768 dims)
```

Local embeddings run in-process inside the backend container. They load at startup and persist in
memory (this is why `workers=1` is the current constraint: multiple workers would each load the
model, exhausting RAM). Setting `EMBEDDING_MODEL=fireworks` removes this constraint and enables
horizontal scaling.

---

## 5. EvidenceOps Workflow Diagram

The complete investigation lifecycle from evidence upload to knowledge capture:

```
┌─────────────────────────────────────────────────────────────────────┐
│                      INVESTIGATION LIFECYCLE                        │
└─────────────────────────────────────────────────────────────────────┘

  [1] OPEN INVESTIGATION
      Analyst creates investigation record
      (title, description, deviation_type, severity)
             │
             ▼
  [2] UPLOAD EVIDENCE
      POST /api/evidence/upload
      ├── File stored in MinIO (helix-evidence bucket)
      ├── Text extracted (PDF/DOCX/TXT parser)
      ├── Text chunked (512 tokens, 64 overlap)
      ├── Chunks embedded (sentence-transformers → 384-dim vectors)
      └── Vectors stored in PostgreSQL pgvector (document_chunks table)
             │
             ▼
  [3] TRIGGER AI ANALYSIS
      POST /api/investigations/{id}/analyze
      ├── hypothesis_workflow.py orchestrates:
      │   ├── retrieval_engine.py: vector similarity search (top-K chunks)
      │   ├── prompt_engine.py: build citation-grounded prompt
      │   ├── InferenceAdapter.complete(): call LLM (mock/fireworks/openai/local)
      │   ├── citation_validator.py: verify [REF-N] citations in output
      │   └── evaluation_engine.py: compute grounding_score, citation_precision
      └── Hypothesis records written to DB with: text, confidence, citations, metrics
             │
             ▼
  [4] GENERATE CAPA
      POST /api/investigations/{id}/capa/generate
      ├── capa_workflow.py:
      │   ├── Retrieves top hypothesis + all evidence chunks
      │   ├── Calls InferenceAdapter with CAPA-generation prompt
      │   └── Writes CAPA draft with corrective + preventive actions
      └── CAPA status: "draft"
             │
             ▼
  [5] HUMAN REVIEW & APPROVAL
      POST /api/capa/{id}/approve  (requires role: manager or admin)
      ├── Human reads CAPA, reviews citations, checks corrective actions
      ├── Either approves (status → "approved") or rejects with reason
      └── Audit event written: actor_id, timestamp, diff
             │
             ▼ (on approval only)
  [6] KNOWLEDGE CAPTURE (CLOSED LOOP)
      knowledge_capture_workflow.py triggered automatically
      ├── Extracts root cause patterns from approved CAPA
      ├── Stores in knowledge_entries table (org_id scoped)
      └── Future investigations retrieve these patterns via vector search
             │
             ▼
  [7] INVESTIGATION CLOSED
      Status → "closed" | Audit trail complete | Metrics frozen
      └── Export: POST /api/export/{investigation_id} → PDF report
```

---

## 6. Data Model Overview

### 6.1 Core Tables

```sql
-- Tenant root
organizations (id PK, name, created_at)

-- Identity
users (id PK, org_id FK, email, hashed_password, role, is_active, created_at)

-- Investigation domain
investigations (
    id PK, org_id FK, title, description,
    status,           -- open|analyzing|analyzed|closed
    deviation_type,   -- quality|process|equipment|environmental
    severity,         -- low|medium|high|critical
    created_by FK→users, assigned_to FK→users,
    created_at, updated_at
)

-- Evidence storage
evidence_files (
    id PK, investigation_id FK, org_id FK,
    filename, file_type, minio_object_key,
    file_size_bytes, processing_status,
    uploaded_by FK→users, created_at
)

-- Vector store (heart of the RAG pipeline)
document_chunks (
    id PK, evidence_file_id FK, org_id FK,
    chunk_index INT,
    content TEXT,
    embedding VECTOR(384),   -- pgvector column
    page_number INT,
    token_count INT,
    created_at
)

-- AI outputs
hypotheses (
    id PK, investigation_id FK, org_id FK,
    title, description, confidence_score FLOAT,
    supporting_evidence JSONB,   -- [{chunk_id, relevance_score, source_text}]
    grounding_score FLOAT,
    citation_precision FLOAT,
    model_name, provider,
    created_at
)

-- CAPA
capa_plans (
    id PK, investigation_id FK, org_id FK,
    corrective_actions JSONB,
    preventive_actions JSONB,
    root_cause_summary TEXT,
    status,               -- draft|pending_approval|approved|rejected
    approved_by FK→users, approved_at,
    rejection_reason TEXT,
    created_at
)

-- Closed-loop learning
knowledge_entries (
    id PK, org_id FK,
    title, content TEXT,
    source_investigation_id FK,
    embedding VECTOR(384),
    tags JSONB,
    created_at
)

-- Immutable audit trail
audit_logs (
    id PK, org_id FK,
    entity_type, entity_id,
    action,     -- create|update|delete|approve|reject|export|login
    actor_id FK→users,
    diff JSONB,
    request_path,
    timestamp
)
```

### 6.2 Entity Relationship Summary

```
Organization
    ├── (1:N) Users
    ├── (1:N) Investigations
    │   ├── (1:N) EvidenceFiles
    │   │   └── (1:N) DocumentChunks [VECTOR(384)]
    │   ├── (1:N) Hypotheses
    │   └── (1:1) CapaPlan
    ├── (1:N) KnowledgeEntries [VECTOR(384)]
    └── (1:N) AuditLogs
```

---

## 7. Technology Choices Rationale

| Technology | Chosen | Alternative | Rationale |
|---|---|---|---|
| **Backend** | FastAPI + Python 3.11 | Django, Flask, Node.js | Native async, automatic OpenAPI, type safety via Pydantic |
| **Database** | PostgreSQL 17 + pgvector | MySQL + Pinecone | Single system for relational + vector; no external vector DB dependency |
| **Object Storage** | MinIO | S3 directly, local filesystem | S3-compatible API; runs locally; trivially migrates to real S3 |
| **Cache** | Redis 7 | Memcached, in-process | Pub/sub for future real-time updates; simple key-value cache |
| **Frontend** | React 18 + TypeScript | Next.js, Vue | Pure SPA; Nginx serves static build; no SSR complexity needed |
| **UI Library** | shadcn/ui + Tailwind | MUI, Ant Design | Composable, no lock-in; accessible components; developer velocity |
| **Embeddings** | sentence-transformers all-MiniLM-L6-v2 | OpenAI ada-002, Cohere | Zero cost, runs locally, 384 dims sufficient for document retrieval |
| **Inference** | Pluggable via InferenceAdapter | Hardcoded LLM client | Hardware independence; one env var switches from laptop to AMD MI300X |
| **AMD Model** | Gemma 4 31B IT (Fireworks) | GPT-4o, Claude | Open weights, multimodal, function calling, 140+ languages, AMD-optimized |
| **Containerization** | Docker Compose | Kubernetes (now), bare metal | Fastest path to reproducible deployment; K8s is the upgrade path |
| **Reverse Proxy** | Nginx Alpine | Traefik, Caddy | Minimal attack surface; proven performance; static config |

---

## 8. Request Flow: Hypothesis Generation

End-to-end trace of a hypothesis generation request:

```
Browser: POST /api/investigations/{id}/analyze
         Authorization: Bearer <JWT>
         ↓
Nginx:   Route to FastAPI backend:8000
         ↓
FastAPI: 1. HTTPBearer extracts JWT
         2. decode_token() verifies signature + expiry
         3. User loaded from DB; org_id extracted
         4. RoleChecker(["analyst","manager","admin"]) gate
         ↓
         5. investigation_service.get_investigation(id, org_id)
            ← SELECT WHERE id=? AND org_id=?  (tenant isolation)
         ↓
         6. evidence_files = get_evidence_for_investigation(id, org_id)
         ↓
         7. hypothesis_workflow.run(investigation, evidence_files):
            a. retrieval_engine.retrieve(query, org_id, top_k=10)
               ← pgvector: SELECT ... ORDER BY embedding <=> $query_vec LIMIT 10
            b. prompt_engine.build_hypothesis_prompt(chunks, investigation)
            c. adapter = get_inference_adapter()  ← reads INFERENCE_PROVIDER env
            d. async with trace_ai_operation("hypothesis_generation"):
                   text = await adapter.complete(messages)
            e. citation_validator.validate(text, retrieved_chunks)
            f. evaluation_engine.score(text, retrieved_chunks)
         ↓
         8. Hypothesis written to DB (with citations, metrics, model_name, provider)
         9. write_audit(action="create", entity_type="hypothesis", ...)
         ↓
Response: 200 OK + Hypothesis JSON (id, title, confidence, citations, grounding_score)
```

---

## 9. Directory Structure

```
Project Helix/
├── docker-compose.yml              # Service orchestration (6 services)
├── .env.example                    # All env vars documented with defaults
├── nginx/
│   └── nginx.conf                  # Reverse proxy: /api/* → backend, /* → frontend
├── backend/
│   ├── Dockerfile                  # Python 3.11-slim, non-root user
│   ├── requirements.txt            # Pinned dependencies
│   └── src/
│       ├── main.py                 # FastAPI app factory + lifespan
│       ├── auth/                   # Registration, login, token refresh
│       ├── evidence/               # File upload, chunking, embedding pipeline
│       ├── investigation/          # Investigation CRUD + analysis trigger
│       ├── knowledge/              # Knowledge base CRUD + retrieval
│       ├── export/                 # PDF report generation
│       ├── core/
│       │   ├── config.py           # Pydantic Settings (all env vars typed)
│       │   ├── security.py         # JWT create/decode, bcrypt hashing
│       │   ├── dependencies.py     # get_current_user, RoleChecker
│       │   ├── audit.py            # AuditLog model + write_audit helper
│       │   ├── database.py         # Async SQLAlchemy engine + get_db
│       │   └── storage.py          # MinIO client abstraction
│       └── ai_runtime/
│           ├── adapters/
│           │   ├── inference_adapter.py   # Protocol + 4 adapters + factory
│           │   └── embedding_adapter.py  # Local + Fireworks embedding adapters
│           ├── workflows/
│           │   ├── hypothesis_workflow.py        # End-to-end hypothesis gen
│           │   ├── capa_workflow.py              # CAPA draft generation
│           │   ├── investigation_workflow.py     # Orchestration
│           │   └── knowledge_capture_workflow.py # Closed-loop learning
│           ├── retrieval_engine.py    # Vector similarity search (pgvector)
│           ├── prompt_engine.py       # Prompt template construction
│           ├── citation_validator.py  # [REF-N] citation verification
│           ├── evaluation_engine.py   # Metrics: grounding, citation, recall
│           ├── observability.py       # AIRuntimeTracker + trace_ai_operation
│           ├── cost_optimizer.py      # Token cost estimation + alerting
│           └── policy_engine.py       # AI output policy enforcement
├── frontend/
│   ├── Dockerfile                  # Node 20 build → nginx static serve
│   └── src/
│       ├── pages/                  # Route pages: investigations, evidence, etc.
│       ├── components/             # Reusable UI components
│       ├── hooks/                  # React Query data fetching hooks
│       └── lib/                    # API client, auth context, utilities
├── evaluation/
│   ├── run_evaluation.py           # Main evaluation runner
│   ├── golden_cases/              # Ground truth test cases (JSON)
│   └── metrics/                   # Metric definitions and calculators
├── sample_data/                    # Apex Precision Mfg demo dataset
├── scripts/
│   ├── seed.py                     # DB seeding (users, orgs, investigations)
│   ├── create_buckets.py          # MinIO bucket initialization
│   ├── generate_demo_data.py      # Synthetic data generation
│   ├── health_check.py            # Service verification script
│   └── verify_system.py           # Full system integration check
└── docs/                          # This documentation directory
```

---

*Architecture maintained in `docs/architecture.md` — update alongside structural code changes.*
