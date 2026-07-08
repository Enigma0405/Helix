# AMD Unicorn Winning Playbook — Project Helix

> **Classification:** Strategic | **Audience:** Demo presenter, team leads
> **Purpose:** Map every judging criterion to explicit implementation evidence
> **Last Updated:** 2026-07-08

---

## Judging Criterion Mapping

The AMD Unicorn track evaluates on five dimensions. Below is the explicit evidence map for each.

---

## Criterion 1: Creativity / Originality

### What judges look for
A novel solution to a real problem, not a wrapper around an LLM API.

### What Helix demonstrates

**EvidenceOps as a new category.** We didn't build a "CAPA chatbot." We built a platform where evidence
is a first-class operational asset — indexed, retrieved by semantic similarity, cited in AI outputs,
and captured back into organizational memory. This is different from:

- RAG chatbots: they answer questions; we produce structured workflow artifacts (hypotheses, CAPAs)
- CAPA management tools: they track workflows; we generate the investigation intelligence
- Generic AI writing tools: they produce text; we produce grounded, citation-validated artifacts

**The closed-loop learning engine is genuinely novel.** When a manager approves a CAPA,
`knowledge_capture_workflow.py` automatically extracts root cause patterns and stores them as
searchable knowledge entries. Future investigations at the same organization surface these patterns
automatically. Most AI platforms produce outputs that disappear. Helix builds compounding institutional memory.

**Hallucination tracking as a platform feature.** We ship with `citation_precision`, `grounding_score`,
and `hallucination_rate` as first-class metrics per investigation. The evaluation panel in the UI shows
these in real time. We're holding the AI accountable in the product itself — not a research paper.

### Where judges should look
- `backend/src/ai_runtime/workflows/knowledge_capture_workflow.py` — closed-loop learning
- `backend/src/ai_runtime/citation_validator.py` — hallucination tracking
- `backend/src/ai_runtime/evaluation_engine.py` — first-class metrics
- UI: Evaluation panel on any investigation

### Talking points
- "We invented a new workflow category: EvidenceOps."
- "The system gets smarter every time a CAPA is approved."
- "We track AI quality the way DevOps teams track deployment reliability."

---

## Criterion 2: Technical Completeness

### What judges look for
A working system with real engineering depth — not a demo that breaks under inspection.

### What Helix demonstrates

**12/12 functional tests passing (RC1 verified, RC2 maintained).** Not mock assertions — real end-to-end
functional tests against the running system.

**Full production stack:**
```
Nginx → FastAPI → PostgreSQL+pgvector + Redis + MinIO
```
Six services, all containerized, all with health checks, all orchestrated via Docker Compose.

**Every engineering concern addressed:**

| Concern | Implementation | File |
|---|---|---|
| Authentication | JWT HS256, bcrypt passwords | `core/security.py` |
| Authorization | RBAC 4 roles, FastAPI Depends injection | `core/dependencies.py` |
| Multi-tenancy | org_id on every table, ORM-level isolation | All domain `models.py` |
| Audit trail | Immutable audit_logs table | `core/audit.py` |
| AI governance | Human approval gate, citation grounding | `workflows/capa_workflow.py` |
| Observability | trace_ai_operation context manager, AIRuntimeTracker | `ai_runtime/observability.py` |
| Cost tracking | Token/cost logging per AI call | `ai_runtime/cost_optimizer.py` |
| Provider independence | InferenceAdapter protocol + factory | `adapters/inference_adapter.py` |
| Evaluation | Golden test cases + metric calculators | `evaluation/` directory |
| Error handling | Middleware catches all exceptions, structured responses | `main.py` |

**No SQLite.** No shortcuts. The production data store is PostgreSQL 17 with pgvector extension.

### Where judges should look
- `docker-compose.yml` — 6 services with health checks
- `backend/src/` directory — 9 domain packages, each with models/schemas/service/router
- `backend/src/ai_runtime/` — 13 files of AI runtime infrastructure
- `scripts/verify_system.py` — 12-test functional verification suite
- `evaluation/` — evaluation framework with golden test cases

### Talking points
- "12 functional tests. All pass. Run `python scripts/verify_system.py`."
- "PostgreSQL with pgvector — not SQLite, not in-memory."
- "Every service has a health check. Every secret is in environment variables."

---

## Criterion 3: Product Potential

### What judges look for
Evidence that this could become a real business serving real customers.

### What Helix demonstrates

**Identified customer pain point with measurable cost.** Quality investigations in regulated industries
take weeks. FDA deviation reports have hard deadlines (72 hours for pharmaceutical incidents).
Every day of investigation delay costs tens of thousands in batch-hold costs.

**Clear market segment.** Target: Quality Engineering teams in:
- Pharmaceutical manufacturing (42,000+ facilities globally)
- Medical device manufacturing (ISO 13485 requires CAPA processes)
- Aerospace (AS9100D CAPA requirements)
- Food & Beverage (FDA 21 CFR Part 117 CAPA requirements)

**Platform extensibility built in:**
- The AI adapters pattern means any LLM can be plugged in
- The domain service pattern means new document types / deviation types are modules
- Multi-tenancy means SaaS is architecturally ready from day one
- The evaluation framework means customers can measure ROI in grounding_score improvements

**Business model clarity:**
- SaaS per-seat: $500/user/month (analyst license)
- Enterprise license: $50K–200K/year for air-gapped deployment
- Professional services: investigation workflow customization for regulated industries

**Compliance readiness signals trust.** The architecture specifically mirrors what regulated enterprise
buyers require: audit trail, RBAC, human approval gates, data isolation. A pharma quality director
looking at the Enterprise_Readiness.md would recognize the architecture as correct.

### Where judges should look
- `docs/Enterprise_Readiness.md` — compliance roadmap
- `docs/FounderOS_Product_Brief.md` — market sizing and business model
- `backend/src/knowledge/` — closed-loop learning (the moat)
- Multi-tenant support: run `python scripts/seed.py` with two different org configs

### Talking points
- "Quality management software is a $12B market. CAPA intelligence is underserved."
- "Our SaaS architecture is ready. Multi-tenancy, RBAC, audit trail — all built."
- "The knowledge base is the moat. Every approved CAPA makes the platform smarter."

---

## Criterion 4: Meaningful AMD Platform Usage

### What judges look for
AMD hardware is meaningfully integrated — not an afterthought or a slide claim.

### What Helix demonstrates

**The InferenceAdapter pattern is the architectural proof.**

```python
# The entire AMD integration is this factory function:
def get_inference_adapter(provider: str | None = None) -> InferenceAdapter:
    provider = provider or settings.INFERENCE_PROVIDER
    if provider == "fireworks":
        return FireworksAdapter()   # → Fireworks AI → Gemma 4 31B → AMD MI300X
    elif provider == "mock":
        return MockAdapter()
    # ...
```

The FireworksAdapter uses the standard OpenAI-compatible client pointed at Fireworks' base URL.
Fireworks routes to Gemma 4 31B IT running on AMD Instinct MI300X clusters.

**Migration is one environment variable:**
```bash
# Before: laptop mode
INFERENCE_PROVIDER=mock

# After: AMD MI300X via Fireworks
INFERENCE_PROVIDER=fireworks
FIREWORKS_API_KEY=fw_...
FIREWORKS_MODEL=accounts/fireworks/models/gemma4-31b-it
```

Zero code changes. Zero redeployment. The architecture enforces this.

**Why AMD MI300X specifically:**

| AMD MI300X Specification | Significance for Helix |
|---|---|
| 192 GB HBM3 memory | Entire Gemma 4 31B model fits in GPU memory with room for long contexts |
| 5.3 TB/s memory bandwidth | Fast KV-cache access for long evidence-context prompts (1,800+ tokens) |
| FP8 inference support | 2x throughput vs FP16 for the same power budget |
| ROCm open stack | No CUDA vendor lock-in; compatible with open ML frameworks |
| Multi-chip architecture | Scales to longer context windows as evidence grows |

**Why this matters for EvidenceOps workloads specifically:**

Investigation hypothesis generation involves long prompts: system prompt + retrieved evidence chunks
+ investigation context can exceed 4,000 tokens. Memory bandwidth is the bottleneck for long-context
inference — exactly the AMD MI300X's strongest capability. This isn't accidental alignment; it's the
right hardware for this workload.

**Gemma 4 31B on AMD: why it's the right model:**

| Capability | Relevance to Helix |
|---|---|
| Open weights | Auditable model; on-premises deployment possible |
| 140+ languages | Global manufacturing teams (Japanese, German, Spanish docs) |
| Strong instruction following | Structured CAPA output with [REF-N] citation format |
| Function calling | Future: structured JSON output for CAPA fields |
| Multimodal (Gemma 4) | Future: analyze images of equipment, photos of deviations |
| Context window: 128K | Handle large batch records and SOP documents in context |

### Where judges should look
- `backend/src/ai_runtime/adapters/inference_adapter.py` — lines 55–91 (FireworksAdapter)
- `.env.example` — lines 51–61 (inference provider configuration)
- `backend/src/core/config.py` — FIREWORKS_* settings
- This document: AMD technical advantage section below

### Talking points
- "One env var. Zero code changes. That's the AMD story."
- "Memory bandwidth is the bottleneck for long-context inference. The MI300X leads the market."
- "Open model + open hardware + managed serving. No lock-in at any layer."

---

## Criterion 5: Demo Quality

### What judges look for
A compelling, smooth demonstration that clearly shows the value proposition.

### What Helix demonstrates

**Complete end-to-end workflow demo in 3 minutes:**
- Evidence upload → chunking → embedding → vector storage
- One-click AI analysis → ranked hypotheses with confidence scores
- Citation click-through → source document passage displayed
- CAPA generation → human approval → audit event → knowledge capture
- AMD story: two lines in config

**Pre-loaded demo data** (`scripts/seed.py`) ensures the demo is always consistent:
- 3 investigations with realistic manufacturing scenarios
- Evidence files already processed and embedded
- CAPA in draft state for the approval demo moment

**Evaluation metrics visible in the UI:**
- Grounding score, citation precision, hallucination rate per investigation
- Not a static screenshot — live computed from actual AI outputs

**Multiple fallback modes:**
- Mock mode: demo works with zero external dependencies
- Fireworks mode: live AI responses from AMD MI300X
- Recovery scripts for every failure mode (see `Demo_QA_Recovery.md`)

### Where judges should look
- Live demo (primary): http://localhost
- `docs/Demo_Script_5min.md` — detailed walkthrough
- `scripts/seed.py` — reproducible demo data
- `evaluation/run_evaluation.py` — live metrics computation

---

## AMD Technical Advantage Narrative

### The Memory Bandwidth Argument

Large language model inference at scale is primarily bottlenecked by memory bandwidth, not compute.
For each generated token, the full KV-cache (keys and values for all attention heads) must be read
from GPU memory. A Gemma 4 31B model with a 4,096-token context has a KV-cache of roughly 16 GB.
Reading this 40+ times per second requires 640+ GB/s just for KV-cache.

The AMD Instinct MI300X delivers 5.3 TB/s — roughly 2.5× the A100 80GB (2 TB/s).
For long-context inference workloads like evidence-based investigation analysis, this translates
directly to throughput and latency.

### The Open Ecosystem Argument

NVIDIA's dominance depends on CUDA lock-in. AMD ROCm is the open alternative.
For enterprise customers in regulated industries, vendor lock-in is a risk:

- Procurement risk: NVIDIA supply constraints affect availability
- Compliance risk: proprietary stack makes security audits harder
- Cost risk: NVIDIA pricing power with no alternatives

AMD + ROCm + open model weights (Gemma 4) + Fireworks API = an entirely open stack.
Helix customers can migrate to on-premises AMD hardware with zero application code changes.

### The Cost Argument

| Model | Provider | Cost per 1M input tokens | Cost per 1M output tokens |
|---|---|---|---|
| GPT-4o | OpenAI | $5.00 | $15.00 |
| Claude 3.5 Sonnet | Anthropic | $3.00 | $15.00 |
| Gemma 4 31B | Fireworks (AMD) | ~$0.22 | ~$0.88 |

For a typical Helix hypothesis generation call (1,842 input + 623 output tokens):
- GPT-4o: ~$0.018
- Gemma 4/Fireworks/AMD: ~$0.0009

**20× cost advantage.** At 1,000 investigations/month for an enterprise customer,
the savings are $17,100/month vs GPT-4o.

---

## The One-Env-Var Migration Story

This is the clearest proof of AMD-readiness. Show it every time:

```bash
# .env — development mode (no API key needed)
INFERENCE_PROVIDER=mock

# .env — AMD production mode (one key, one line change)
INFERENCE_PROVIDER=fireworks
FIREWORKS_API_KEY=fw_xxxxxxxxxxx
FIREWORKS_MODEL=accounts/fireworks/models/gemma4-31b-it

# No code changes. No Docker rebuild. No database migration.
# docker compose restart backend  → done.
```

The `get_inference_adapter()` function in `inference_adapter.py` reads `INFERENCE_PROVIDER` from
the environment at startup. The adapter cache resets on restart. The rest of the system is
completely unaware of which provider is active. This is the InferenceAdapter pattern working as designed.

---

*Related: `docs/Demo_Script_3min.md` | `docs/Demo_Script_5min.md` | `docs/Enterprise_Readiness.md`*
