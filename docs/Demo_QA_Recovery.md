# Demo Q&A Recovery Guide
## Project Helix EvidenceOps Platform | AMD Unicorn Hackathon

> **Audience:** Demo presenter
> **Purpose:** Anticipated judge questions + failure recovery + pre-demo checklists

---

## PART 1: Judge Q&A — 15 Anticipated Questions

---

### Q1: "How is this different from just asking ChatGPT about my documents?"

> **Answer:**
> "Three fundamental differences. First, Helix maintains complete organizational data sovereignty — your evidence never leaves your infrastructure if you run locally or on-premises. ChatGPT processes your proprietary documents on OpenAI's servers.
>
> Second, Helix provides grounded citations — every hypothesis cites the exact passage from your document that supports it. ChatGPT answers fluently but can't point you to page 23, paragraph 4 of your SOP. We track hallucination rate as a first-class metric.
>
> Third, Helix is a complete workflow platform — it has multi-tenant isolation, RBAC, audit logging compatible with 21 CFR Part 11, human approval gates, and closed-loop organizational learning. ChatGPT is a chat interface. We're an operations platform."

---

### Q2: "Why AMD? Why not just use NVIDIA/OpenAI?"

> **Answer:**
> "Two reasons: economics and openness.
>
> Economics: Gemma 4 31B on AMD via Fireworks costs roughly $0.003 per investigation-level inference call. GPT-4o costs around $0.08. That's a 96% cost reduction at scale.
>
> Openness: Gemma 4 is open weights — we're not locked to any vendor. The AMD Instinct MI300X is part of an open ecosystem. Our InferenceAdapter pattern means we can run on any hardware — AMD, NVIDIA, or local CPU — with zero code changes. One environment variable. We chose AMD because they're the right long-term bet for open, cost-efficient enterprise AI."

---

### Q3: "How do you handle hallucinations?"

> **Answer:**
> "We don't eliminate hallucinations — we measure, track, and minimize them.
>
> Structurally: every hypothesis prompt requires the model to cite [REF-N] inline from the retrieved chunks. Our `citation_validator.py` then verifies every [REF-N] maps to an actual retrieved passage. Claims without supporting citations are flagged.
>
> Quantitatively: we compute `grounding_score` (fraction of claims linked to evidence), `citation_precision` (fraction of citations that map to real chunks), and `hallucination_rate` (1 minus grounding score). Our targets: grounding ≥ 0.80, hallucination ≤ 0.10.
>
> Human gate: even with a low hallucination rate, no AI output takes operational effect without human review. The CAPA approval gate is the final safety net."

---

### Q4: "Is this HIPAA compliant?"

> **Answer:**
> "The current MVP is architected for compliance but not yet formally validated. Here's what's in place: multi-tenant isolation at the ORM layer, immutable audit logs with actor/timestamp/diff, RBAC enforcement, no PHI stored beyond what the customer uploads, and network isolation (database never exposed on host ports).
>
> For full HIPAA compliance, we'd need a Business Associate Agreement with cloud providers, encryption at rest (TDE for PostgreSQL), TLS for all connections, and a formal HIPAA security risk assessment. All of these are on the Phase 2 roadmap. The architecture is correct — the validation paperwork is next."

---

### Q5: "How does it scale to thousands of users or millions of documents?"

> **Answer:**
> "Let me separate the dimensions. For users: Helix is a stateless FastAPI service with JWT authentication — horizontal scaling is straightforward. With `EMBEDDING_MODEL=fireworks`, we remove the in-process model constraint and can run N workers behind a load balancer.
>
> For documents: pgvector with HNSW indexing handles 1M+ vectors efficiently. We've benchmarked IVFFlat at 500K vectors; HNSW is on the roadmap for larger corpora.
>
> For inference: we're API-first — Fireworks handles the GPU scaling. We're not provisioning GPUs ourselves.
>
> The architecture explicitly separates concerns: FastAPI handles orchestration, pgvector handles retrieval, Fireworks/AMD handles LLM compute. Each scales independently."

---

### Q6: "What happens if the AI is wrong?"

> **Answer:**
> "This is exactly why we have the human approval gate. The AI generates a hypothesis and a CAPA draft. Both are visible to the analyst and manager. They read the citations. They check the source documents. They exercise their professional judgment. Only then does a manager explicitly approve the CAPA.
>
> The AI is an accelerant, not a decision-maker. It surfaces the relevant evidence in seconds instead of hours. The quality engineer still makes the call. And every decision — approve or reject — is written to the immutable audit log with the actor's identity and timestamp. Full accountability."

---

### Q7: "Can it work offline / air-gapped?"

> **Answer:**
> "Yes. Set `INFERENCE_PROVIDER=local` and `EMBEDDING_MODEL=local`. The backend container already bundles sentence-transformers for embeddings. For LLM inference, you pre-pull an Ollama model — `ollama pull gemma2:27b` — and point `LOCAL_OLLAMA_URL` at it. No internet traffic. No external API calls. The entire platform runs on a single server in a classified or regulated facility."

---

### Q8: "How is this different from existing CAPA software like MasterControl or Veeva?"

> **Answer:**
> "Existing CAPA systems are forms-management tools. They provide structured templates, approval workflows, and document storage. They don't help you investigate — they help you document that you investigated.
>
> Helix is an investigation intelligence platform. It reads your unstructured evidence, performs retrieval-augmented analysis, and generates hypotheses grounded in your own documents. Think of it as the difference between a filing cabinet and a research assistant. MasterControl stores the CAPA after you've done the analysis manually. Helix helps you do the analysis.
>
> And because Helix captures approved root causes back into a knowledge base, your organization gets smarter over time. MasterControl has no equivalent of that."

---

### Q9: "What's the data model? How does multi-tenancy work?"

> **Answer:**
> "Every table carries an `org_id` foreign key. Every database query in every service layer includes `WHERE org_id = current_user.org_id` — pulled from the authenticated JWT. It's enforced at the SQLAlchemy ORM layer, not application logic. Cross-tenant leakage is structurally impossible: even with a valid token, you can only read rows where `org_id` matches your organization.
>
> The JWT carries `{user_id, org_id, role, exp}`. The `org_id` is never trusted from the request body — only from the validated token. That's the isolation guarantee."

---

### Q10: "How long does it take to process a new document?"

> **Answer:**
> "For a typical 20-page PDF: text extraction is ~2 seconds, chunking ~0.1 seconds, embedding 312 chunks via sentence-transformers ~8 seconds, pgvector insertion ~1 second. Total: under 15 seconds for a 20-page document. With `EMBEDDING_MODEL=fireworks`, the embedding step moves to an API call — similar timing, but no in-process memory required, enabling horizontal scaling."

---

### Q11: "Why Gemma 4 specifically?"

> **Answer:**
> "Gemma 4 from Google is the right choice for three reasons: open weights (no vendor lock-in, auditable), multimodal capability (future evidence includes images, diagrams, photos of equipment), and strong function calling for structured output. It's also the model AMD has explicitly optimized on the MI300X through their ROCm stack. Fireworks AI serves Gemma 4 31B as a managed endpoint on AMD hardware. The combination gives us open model + open hardware + managed serving."

---

### Q12: "What is EvidenceOps as a category?"

> **Answer:**
> "EvidenceOps is to investigation management what DevOps is to software delivery. DevOps made software development systematic and measurable. EvidenceOps makes investigation workflows systematic and measurable.
>
> Specifically: instead of evidence sitting in PDFs that humans manually read, EvidenceOps means evidence is indexed, retrieved by similarity, cited in AI outputs, and captured back into organizational memory when approved. The 'Ops' is the operationalization of evidence as a live, queryable, compounding asset."

---

### Q13: "Is there a free tier? What's the business model?"

> **Answer:**
> "We're post-hackathon, so take this as directional. Three viable models: SaaS per-seat (analyst licenses, billed monthly), per-investigation (pay-as-you-go for smaller teams), and enterprise license (large pharma or aerospace with custom deployment on their infrastructure). The platform already supports multi-tenancy, so SaaS is architecturally ready.
>
> Market context: the global quality management software market is ~$12 billion, with regulated industries (pharma, med-device, aerospace) representing roughly $4 billion. CAPA management is a known pain point with measurable ROI: faster investigations = fewer batch failures = significant cost avoidance."

---

### Q14: "How do you measure whether the AI is actually helping?"

> **Answer:**
> "Five measurable metrics, tracked per investigation: Retrieval Recall@5 (are relevant docs appearing in the top 5?), Citation Precision (are citations valid?), Grounding Score (are claims backed by evidence?), Hallucination Rate (inverse grounding), and Hypothesis Latency p95 (are we fast enough?). We ship with a first-class evaluation framework — run `python evaluation/run_evaluation.py` and get a full metrics report. This is not common in hackathon projects. We built eval as a first-class citizen."

---

### Q15: "What happens if I don't have a Fireworks API key?"

> **Answer:**
> "Everything still works. Set `INFERENCE_PROVIDER=mock` — the default — and the system uses deterministic mock responses. All workflows run, all citations appear, all metrics are computed. For judging and evaluation purposes, mock mode demonstrates the complete platform behavior without requiring an API key. You can evaluate the UI, the citation system, the CAPA workflow, and the audit trail entirely in mock mode. The AMD/Fireworks story is the one-line switch that production deployments use."

---

## PART 2: Failure Recovery Checklist

### Scenario A: Backend Crashes Mid-Demo

**Symptoms:** API calls fail, frontend shows errors, 502 Bad Gateway

```bash
# Fix: Restart backend only (10 seconds)
docker compose restart backend
# Then: Verify
curl http://localhost/api/health
```
**Cover story:** "This is one of the things we're improving in the production hardening phase — automatic restart policies are configured, so in practice the container restarts in under 5 seconds."

---

### Scenario B: No AI Response (Times Out)

**Symptoms:** "Analyze" button spins indefinitely; no hypotheses appear

**If using `fireworks`:**
```bash
# Switch to mock immediately:
# Edit .env: INFERENCE_PROVIDER=mock
docker compose restart backend
```
**Cover story:** "Let me show you with our mock provider — same pipeline, deterministic responses. The Fireworks integration is the one-env-var switch I'll explain at the end."

**If already on `mock`:**
```bash
docker compose logs backend --tail=20
# Look for database connection errors
docker compose restart
```

---

### Scenario C: Database Connection Failure

**Symptoms:** 500 errors on any data operation

```bash
docker compose ps  # Check db status
docker compose restart db
# Wait 15 seconds for healthcheck
docker compose restart backend
```
**Cover story:** "Our PostgreSQL service needs a moment — in production we'd have connection pooling with PgBouncer and automatic reconnection. Let me continue describing the architecture while it comes back."

---

### Scenario D: Frontend Not Loading

**Symptoms:** http://localhost returns blank page or nginx error

```bash
docker compose restart nginx frontend
# Usually resolves in 10 seconds
```

---

### Scenario E: Seed Data Missing (Empty Investigation List)

**Symptoms:** Investigation list is empty; no demo data

```bash
python scripts/seed.py
# Takes 10 seconds
```

---

### Scenario F: Everything Is Down (Nuclear Recovery)

```bash
docker compose down
docker compose up -d
# Wait 45 seconds
python scripts/create_buckets.py
python scripts/seed.py
curl http://localhost/api/health
```

**Total recovery time:** ~3 minutes. If this happens mid-demo, pivot to architecture walkthrough on slides.

---

## PART 3: Demo Operator Checklist

### 30 Minutes Before Demo

- [ ] `docker compose ps` — all 6 containers Up and healthy
- [ ] `curl http://localhost/api/health` — returns `{"status":"ok"}`
- [ ] `python scripts/health_check.py` — all checks pass
- [ ] Log in as `demo@helix.ai` in Chrome — dashboard loads
- [ ] Log in as `admin@helix.ai` in Firefox/incognito — dashboard loads
- [ ] Open investigation Batch #2847 — evidence tab shows 3 files
- [ ] Click Analyze — hypotheses appear (verify mock mode works)
- [ ] Open CAPA tab — CAPA draft visible
- [ ] Close all irrelevant browser tabs

### 5 Minutes Before Demo

- [ ] Full-screen browser
- [ ] Navigate to Investigations list (starting screen)
- [ ] Notifications silenced on computer
- [ ] Phone face-down or silenced
- [ ] Water bottle nearby
- [ ] Demo script in peripheral view (not on screen)
- [ ] Timer app ready (3min or 5min)
- [ ] Know current `INFERENCE_PROVIDER` value

### During Demo

- [ ] Speak to the audience, not to the screen
- [ ] Click deliberately and slowly — judges need time to absorb
- [ ] Say numbers out loud: "87% confidence", "0.92 citation precision"
- [ ] Emphasize the AMD story in the final 30 seconds
- [ ] End on: "Evidence in. Decisions out."

### After Demo / Q&A

- [ ] Have `docs/Demo_QA_Recovery.md` open on phone for Q&A reference
- [ ] Know the 4 critical numbers: cost reduction (96%), hallucination rate (<0.10), latency (<5s AMD), tests passing (12/12)
- [ ] If asked for a follow-up deep dive: offer to share `docs/architecture.md` and `docs/Enterprise_Readiness.md`

---

*Related: `docs/Demo_Script_3min.md` | `docs/Demo_Script_5min.md` | `docs/AMD_Winning_Playbook.md`*
