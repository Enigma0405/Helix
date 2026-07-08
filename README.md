# 🧬 Project Helix — EvidenceOps Platform

> **AMD Unicorn Hackathon** | AI-powered investigation intelligence — Gemma 4 on AMD Instinct MI300X via Fireworks AI

[![Docker](https://img.shields.io/badge/Docker-Compose-blue)](docker-compose.yml)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-green)](backend/)
[![React](https://img.shields.io/badge/Frontend-React-61DAFB)](frontend/)
[![pgvector](https://img.shields.io/badge/DB-pgvector-336791)](https://github.com/pgvector/pgvector)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

---

## 📋 Overview

Project Helix is a **production-quality EvidenceOps platform** built for pharmaceutical and medical device quality engineering teams. It transforms unstructured investigation evidence (SOPs, CAPA reports, batch records, environmental monitoring data) into structured, AI-powered root cause hypotheses with full citation grounding.

**The core value proposition:** An investigator uploads evidence documents, and Helix returns ranked root-cause hypotheses — each backed by exact citations to the source documents — in under 5 minutes. Every AI claim is verified against the evidence corpus. Hallucinations are tracked and minimized.

### 🎯 AMD Unicorn Hackathon Context

Helix demonstrates the full AMD inference story:

```
Helix Platform
    ↓ InferenceAdapter (one env var to switch)
Fireworks AI API
    ↓ Routes to
Gemma 4 31B IT (multimodal, function-calling, 140+ languages)
    ↓ Runs on
AMD Instinct MI300X GPU Cluster
```

Switch from `mock` → `fireworks` in `.env` and Helix instantly routes all AI calls through Fireworks AI to Gemma 4 31B IT running on AMD MI300X hardware — no code changes required.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        HELIX PLATFORM                           │
│                                                                 │
│  ┌──────────┐    ┌─────────────────────────────────────────┐   │
│  │          │    │              NGINX (Port 80)             │   │
│  │  Browser │───▶│  /api/* → FastAPI  |  /* → React SPA   │   │
│  │          │    └──────────────┬──────────────────────────┘   │
│  └──────────┘                   │                              │
│                    ┌────────────▼────────────┐                 │
│                    │    FastAPI Backend       │                 │
│                    │  ┌──────────────────┐   │                 │
│                    │  │  API Routes      │   │                 │
│                    │  │  Auth / RBAC     │   │                 │
│                    │  │  Ingestion       │   │                 │
│                    │  │  AI Workflows    │   │                 │
│                    │  │  InferenceAdapter│   │                 │
│                    │  └──────────────────┘   │                 │
│                    └──┬────────┬────────┬────┘                 │
│                       │        │        │                       │
│            ┌──────────▼┐  ┌───▼───┐  ┌─▼──────────┐          │
│            │ PostgreSQL │  │ Redis │  │   MinIO    │          │
│            │ + pgvector │  │(queue)│  │ (evidence) │          │
│            └───────────┘  └───────┘  └────────────┘          │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │               InferenceAdapter (Pluggable)               │  │
│  │  mock ──▶ deterministic test responses                   │  │
│  │  fireworks ──▶ Fireworks AI ──▶ Gemma 3 ──▶ AMD MI300X │  │
│  │  openai ──▶ OpenAI API                                   │  │
│  │  local ──▶ Ollama / llama.cpp                            │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## ⚡ Quick Start (5 Minutes)

### Prerequisites
- Docker Desktop 4.x+ with Compose v2
- Python 3.11+ (for scripts)
- 4 GB RAM minimum (8 GB recommended)

### 1. Clone and configure

```bash
git clone https://github.com/your-org/project-helix.git
cd "project-helix"

# Copy and configure environment variables
cp .env.example .env
# Edit .env — at minimum set a JWT_SECRET_KEY
```

### 2. Start all services

```bash
docker compose up -d --build
```

### 3. Wait for health checks, then create buckets

```bash
# Wait ~30 seconds for services to be healthy
docker compose ps  # Verify all services are "healthy"

# Create MinIO buckets
pip install minio
python scripts/create_buckets.py
```

### 4. Seed the database

```bash
pip install psycopg[async] passlib[bcrypt]
python scripts/seed.py
```

### 5. Run the demo

Open [http://localhost](http://localhost) and log in:
- **Demo Analyst:** `demo@helix.ai` / `helixdemo2024`
- **Admin:** `admin@helix.ai` / `helixadmin2024`

### 6. Verify everything is working

```bash
python scripts/health_check.py
```

---

## 🗺️ API Documentation

Once running, interactive API docs are available at:
- **Swagger UI:** [http://localhost/api/docs](http://localhost/api/docs)
- **ReDoc:** [http://localhost/api/redoc](http://localhost/api/redoc)

Full API reference: [docs/api.md](docs/api.md)

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18 + TypeScript | Single-page application |
| **UI Library** | shadcn/ui + Tailwind CSS | Design system |
| **Backend** | FastAPI + Python 3.11 | Async REST API |
| **Database** | PostgreSQL 17 + pgvector | Relational + vector search |
| **Object Storage** | MinIO (S3-compatible) | Evidence file storage |
| **Cache / Queue** | Redis 7 | Task queue + caching |
| **Reverse Proxy** | Nginx Alpine | Single entry point |
| **Embeddings** | sentence-transformers | Local vector embeddings |
| **AI Inference** | Fireworks AI → Gemma 4 31B IT | Root cause analysis on AMD MI300X |
| **AMD Hardware** | MI300X GPU cluster | LLM compute backend |
| **Containerization** | Docker Compose | Local + production deploy |

---

## 📅 Sprint Plan

| Sprint | Focus | Key Deliverables |
|--------|-------|-----------------|
| **A** | Foundation | Auth, DB schema, project structure |
| **B** | AI Core | InferenceAdapter, RAG pipeline, hypothesis engine |
| **C** | Evidence Ingestion | Document upload, chunking, embedding pipeline |
| **D** | Data & Demo | Sample data, seed scripts, evaluation framework |
| **E** | Polish | UI refinement, error handling, performance |
| **F** | Hackathon | Demo script rehearsal, final evaluation run |

---

## 🧭 Engineering Principles

All development follows these 14 principles:

1. **Evidence-First** — Every AI claim must be traceable to a source document
2. **Grounding Over Fluency** — A well-grounded answer beats a fluent hallucination
3. **Evaluation is First-Class** — No feature ships without a metric and a golden test
4. **Adapter Pattern Everywhere** — Swap any provider (AI, storage, DB) via config
5. **Zero Trust by Default** — Every API endpoint requires authentication
6. **RBAC at the Row Level** — Users only see investigations they're authorized for
7. **Async All the Way** — No blocking I/O; everything is async/await
8. **Fail Loudly, Recover Gracefully** — Structured error responses, never raw tracebacks
9. **Cost Awareness** — Track token costs per investigation, alert on anomalies
10. **Latency Budgets** — p95 hypothesis latency ≤ 10 seconds
11. **Modular Monolith First** — Ship fast, extract microservices only when needed
12. **Docs as Code** — Architecture docs live in the repo and are updated with PRs
13. **AMD-Ready** — All AI workloads route through InferenceAdapter for hardware portability
14. **Demo-Driven Development** — Every feature is validated against the 5-minute demo script

---

## 🎬 5-Minute Demo Script

For the full demo script with judge talking points, see [docs/demo_script.md](docs/demo_script.md).

### Quick version (12 steps):

1. Open [http://localhost](http://localhost) — show the landing page
2. Log in as `demo@helix.ai`
3. Navigate to **Investigations** — show existing Batch #2847 case
4. Open the investigation — show the overview panel
5. Click **Evidence** tab — show uploaded SOP and batch record documents
6. Click **Analyze** — trigger the AI hypothesis generation
7. Watch the real-time progress indicator (≤5 seconds with Fireworks)
8. Show the ranked hypotheses with confidence scores
9. Click a hypothesis — show the full citation list with exact document references
10. Click a citation — show the source text highlighted in the document viewer
11. Navigate to **CAPA** tab — show the AI-generated action plan
12. Show the **Evaluation** panel — citation precision, grounding score, hallucination rate

---

## 📊 Evaluation Framework

Helix ships with a built-in evaluation framework. Run it against the golden test cases:

```bash
pip install httpx rich
python evaluation/run_evaluation.py --api-url http://localhost/api
```

See [evaluation/README.md](evaluation/README.md) for full details.

**Key metrics tracked:**
- Retrieval Recall@5 (target: ≥ 0.8)
- Citation Precision (target: ≥ 0.9)
- Grounding Score (target: ≥ 0.8)
- Hallucination Rate (target: ≤ 0.10)
- Hypothesis Latency p95 (target: ≤ 10,000ms)

---

## 🔴 AMD Integration Story

See [docs/amd_integration.md](docs/amd_integration.md) for the full AMD story.

**TL;DR:** Change one line in `.env`:

```bash
# Before (mock/test mode)
INFERENCE_PROVIDER=mock

# After (AMD Instinct MI300X via Fireworks AI → Gemma 4 31B IT)
INFERENCE_PROVIDER=fireworks
FIREWORKS_API_KEY=your_key_here
FIREWORKS_MODEL=accounts/fireworks/models/gemma-4-31b-it
```

That's the entire migration. No code changes. No redeployment. The `InferenceAdapter` abstraction means Helix is hardware-agnostic by design. The same investigation workflow runs identically on mock, OpenAI, local Ollama, or AMD MI300X — only the hardware backend changes.

---

## 📁 Project Structure

```
Project Helix/
├── docker-compose.yml          # Service orchestration
├── .env.example                # Environment template
├── nginx/
│   └── nginx.conf              # Reverse proxy config
├── backend/                    # FastAPI application
│   ├── Dockerfile
│   ├── app/
│   │   ├── api/               # Route handlers
│   │   ├── core/              # Config, security, DB
│   │   ├── models/            # SQLAlchemy models
│   │   ├── schemas/           # Pydantic schemas
│   │   ├── services/          # Business logic
│   │   └── runtime/           # AI runtime (adapters, workflows)
│   └── tests/
├── frontend/                   # React + TypeScript SPA
│   ├── Dockerfile
│   └── src/
├── evaluation/                 # First-class evaluation framework
│   ├── golden_cases/          # Ground truth test cases
│   ├── metrics/               # Metric definitions
│   ├── benchmarks/            # Provider comparisons
│   └── run_evaluation.py      # Main evaluation runner
├── sample_data/                # Demo dataset (Apex Precision Mfg)
├── scripts/                    # Operational scripts
│   ├── seed.py                # DB seeding
│   ├── create_buckets.py      # MinIO bucket setup
│   ├── generate_demo_data.py  # Synthetic data generation
│   └── health_check.py        # Service verification
└── docs/                       # Architecture & API documentation
    ├── architecture.md
    ├── amd_integration.md
    ├── api.md
    ├── demo_script.md
    └── sprint_d.md
```

---

## 🤝 Contributing

1. Follow the engineering principles above
2. All new AI features require golden test cases in `evaluation/golden_cases/`
3. Run `python evaluation/run_evaluation.py` before submitting a PR
4. Update `docs/api.md` for any API changes

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

*Built with ❤️ for the AMD Unicorn Hackathon | Project Helix Team*
