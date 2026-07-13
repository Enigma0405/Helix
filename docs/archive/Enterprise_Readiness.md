# Enterprise Readiness — Project Helix EvidenceOps Platform

> **Version:** RC2 | **Audience:** Enterprise Evaluators, Judges, Solution Architects
> **Last Updated:** 2026-07-08

---

## Overview

Project Helix is architected for production deployment from day one. This document covers the enterprise
capabilities built into the current MVP: deployment flexibility, identity and access control, audit
logging, multi-tenant isolation, AI governance, security controls, and the roadmap toward full
enterprise certification (SOC 2, 21 CFR Part 11, ISO 27001).

---

## 1. Deployment Models

Helix ships as a single `docker-compose.yml` that encapsulates all six services (Nginx, FastAPI, React,
PostgreSQL+pgvector, Redis, MinIO). The same codebase runs across all deployment targets with only
environment variable changes.

| Deployment Mode | Infrastructure | Inference Provider | Notes |
|---|---|---|---|
| **Local Demo** | Laptop (8 GB RAM) | `mock` | Zero cost, zero network. For evaluation. |
| **Cloud VM** | AWS EC2 / GCP Compute / Azure VM | `fireworks` | Single VM, Docker Compose. Production-viable for SMB. |
| **Cloud K8s** | AWS EKS / GCP GKE / Azure AKS | `fireworks` | Helm chart (roadmap). Horizontal scaling. |
| **Private Cloud** | VMware / OpenStack | `fireworks` or `local` | No data leaves private network if `local`. |
| **On-Premises Air-Gap** | Bare metal / on-prem VM | `local` (Ollama) | Fully offline. INFERENCE_PROVIDER=local + Ollama. |

### On-Premises Air-Gap Configuration

```bash
# .env for fully air-gapped deployment
INFERENCE_PROVIDER=local
LOCAL_INFERENCE_URL=http://localhost:11434/v1
LOCAL_MODEL=gemma2:27b   # pulled via: ollama pull gemma2:27b
EMBEDDING_MODEL=local     # sentence-transformers runs inside backend container
```

No data ever leaves the on-premises network. The backend container bundles
`sentence-transformers/all-MiniLM-L6-v2` (384-dim embeddings) and Ollama provides LLM inference.

### Cloud VM (Single-Node Production)

Minimum specification for production workloads:

| Resource | Minimum | Recommended |
|---|---|---|
| CPU | 4 vCPU | 8 vCPU |
| RAM | 8 GB | 16 GB |
| Storage | 50 GB SSD | 200 GB SSD |
| GPU | Not required (Fireworks API) | Not required |
| Ports open | 80 (HTTP), 443 (HTTPS via reverse proxy) | Same + 9001 (MinIO console) |

---

## 2. Role-Based Access Control (RBAC)

### 2.1 Role Hierarchy

Helix defines four roles with strictly additive permissions:

| Role | Description | Typical User |
|---|---|---|
| `viewer` | Read-only access to investigations and evidence | Auditor, quality approver |
| `analyst` | Create/edit investigations; upload evidence; run AI analysis | Quality engineer |
| `manager` | All analyst permissions + approve/reject CAPAs | Quality manager |
| `admin` | All permissions + user management, org settings | System administrator |

### 2.2 Permission Matrix

| Action | Resource | viewer | analyst | manager | admin |
|---|---|:---:|:---:|:---:|:---:|
| Read | Investigations | ✅ | ✅ | ✅ | ✅ |
| Create | Investigations | ❌ | ✅ | ✅ | ✅ |
| Update | Investigations | ❌ | ✅ | ✅ | ✅ |
| Delete | Investigations | ❌ | ❌ | ✅ | ✅ |
| Read | Evidence files | ✅ | ✅ | ✅ | ✅ |
| Upload | Evidence files | ❌ | ✅ | ✅ | ✅ |
| Delete | Evidence files | ❌ | ❌ | ✅ | ✅ |
| Run | AI Analysis | ❌ | ✅ | ✅ | ✅ |
| Read | Hypotheses | ✅ | ✅ | ✅ | ✅ |
| Approve/Reject | CAPA | ❌ | ❌ | ✅ | ✅ |
| Read | Audit logs | ❌ | ❌ | ✅ | ✅ |
| Export | Audit logs | ❌ | ❌ | ❌ | ✅ |
| Manage | Users | ❌ | ❌ | ❌ | ✅ |
| Manage | Organization | ❌ | ❌ | ❌ | ✅ |

### 2.3 Implementation

The role is embedded in the JWT at login time. Every protected route uses FastAPI `Depends` injection:

```python
# backend/src/core/dependencies.py

class RoleChecker:
    """Dependency factory that restricts access to specific roles."""

    def __init__(self, allowed_roles: list[str]) -> None:
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: CurrentUser) -> _CurrentUserPayload:
        if current_user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{current_user.role}' is not permitted. "
                       f"Required: {self.allowed_roles}",
            )
        return current_user

# Usage at the router level:
router = APIRouter(
    dependencies=[Depends(RoleChecker(["manager", "admin"]))]
)
```

The JWT payload carries `{"sub": user_id, "org_id": org_id, "role": "analyst", "exp": ...}`.
Role elevation requires re-authentication (new token issued on role change).

---

## 3. Audit Logging

### 3.1 Schema

Every significant action writes an immutable record to `audit_logs` in PostgreSQL:

```sql
CREATE TABLE audit_logs (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id       UUID REFERENCES organizations(id) ON DELETE SET NULL,
    entity_type  VARCHAR(100) NOT NULL,   -- 'investigation', 'capa', 'evidence', 'user'
    entity_id    UUID,                    -- UUID of the affected record
    action       VARCHAR(50) NOT NULL,    -- create|update|delete|approve|reject|export|login
    actor_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    diff         JSONB,                   -- before/after diff (optional)
    request_path VARCHAR(500),            -- e.g. POST /api/investigations/123/capa/approve
    timestamp    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX audit_logs_org_timestamp ON audit_logs(org_id, timestamp DESC);
CREATE INDEX audit_logs_entity ON audit_logs(entity_type, entity_id);
```

### 3.2 Write Helper

```python
# Anywhere in the backend — one call, fully async:
await write_audit(
    entity_type="investigation",
    action="approve",
    entity_id=investigation.id,
    actor_id=current_user.user_id,
    org_id=current_user.org_id,
    diff={"status": {"before": "open", "after": "closed"}},
    request_path=request.url.path,
    db=db,
)
```

### 3.3 Compliance Use Cases

| Standard | Requirement | Helix Implementation |
|---|---|---|
| **21 CFR Part 11** (FDA) | Electronic records with audit trail; no retroactive editing | Immutable `audit_logs` table; no DELETE on audit rows |
| **ISO 13485** (Medical Devices) | Document control with change history | `diff` field captures before/after state on every update |
| **GMP (21 CFR Part 211)** | Batch record traceability | All investigation actions traceable by actor + timestamp |
| **ISO 9001** | CAPA effectiveness evidence | Approval events recorded with approver ID and timestamp |
| **GDPR** | Accountability for data access | All read/write on personal data logged |

### 3.4 Exporting Audit Trails

**Via API (authenticated, admin role required):**
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost/api/audit?org_id=<uuid>&from=2024-01-01&to=2024-12-31" \
  > audit_export.json
```

**Direct database query:**
```sql
SELECT
    al.timestamp,
    u.email        AS actor_email,
    al.action,
    al.entity_type,
    al.entity_id,
    al.diff,
    al.request_path
FROM audit_logs al
LEFT JOIN users u ON al.actor_id = u.id
WHERE al.org_id = '<your_org_uuid>'
  AND al.timestamp >= '2024-01-01'
ORDER BY al.timestamp DESC;
```

---

## 4. Multi-Tenancy

### 4.1 Data Isolation Architecture

Every persistent table carries `org_id` as a foreign key to `organizations`:

```
organizations
    ├── users              (org_id)
    ├── investigations     (org_id)
    │   ├── evidence_files (org_id via investigation)
    │   ├── hypotheses     (org_id via investigation)
    │   └── capa_plans     (org_id via investigation)
    ├── document_chunks    (org_id)
    ├── knowledge_entries  (org_id)
    └── audit_logs         (org_id)
```

### 4.2 ORM-Level Enforcement

All service layer queries include the `org_id` filter from the authenticated user's JWT claim:

```python
# Pattern used consistently across all domain services:
result = await db.execute(
    select(Investigation).where(
        Investigation.id == investigation_id,
        Investigation.org_id == current_user.org_id,  # ← tenant boundary
    )
)
```

Cross-tenant data leakage is structurally impossible: even if a user obtained another tenant's UUID,
the query returns no rows because `org_id` never matches.

### 4.3 Tenant Onboarding Flow

```
POST /api/auth/register
  → Creates Organization record
  → Creates User with role=admin
  → Issues JWT with org_id embedded
  → Returns access + refresh tokens

All subsequent API calls automatically scoped to that org_id.
```

---

## 5. AI Governance

### 5.1 Human-in-the-Loop Enforcement

> **AI NEVER makes the final decision.** Every CAPA plan generated by AI must be explicitly
> approved by a human with `manager` or `admin` role before it takes operational effect.

Workflow state machine:

```
AI generates CAPA → status: "draft"              (machine output)
Analyst submits   → status: "pending_approval"   (human action)
Manager reviews   → status: "approved"           (human decision + audit event)
                  OR status: "rejected"          (human decision + rejection_reason required)
Approval triggers → knowledge_capture_workflow() (automated knowledge update)
```

`capa_plans.approved_by` is only populated by the `POST /capa/{id}/approve` endpoint, which requires
`RoleChecker(["manager", "admin"])`. A draft CAPA has zero operational effect.

### 5.2 Citation Grounding

Every AI-generated hypothesis must cite retrieved evidence:

1. Retrieval engine fetches top-K evidence chunks (vector similarity via pgvector)
2. Each chunk carries: `document_id`, `chunk_index`, `page_number`, `source_text`
3. Prompt instructs model to cite `[REF-N]` inline within hypothesis text
4. `citation_validator.py` verifies every `[REF-N]` maps to an actual retrieved chunk
5. Ungrounded citations are flagged as hallucinations in the metrics

### 5.3 Hallucination Tracking Metrics

| Metric | Definition | Target |
|---|---|---|
| `citation_precision` | Fraction of cited refs that map to real chunks | ≥ 0.90 |
| `grounding_score` | Fraction of hypothesis claims linked to evidence | ≥ 0.80 |
| `hallucination_rate` | 1 − grounding_score | ≤ 0.10 |
| `retrieval_recall@5` | Fraction of relevant docs in top-5 retrieval | ≥ 0.80 |
| `hypothesis_latency_p95` | 95th percentile hypothesis generation latency | ≤ 10,000 ms |

### 5.4 Cost and Token Tracking

Every AI call records: `provider`, `model`, `prompt_tokens`, `completion_tokens`, `cost_usd`, `latency_ms`.
`AIRuntimeTracker` (singleton in `ai_runtime/observability.py`) aggregates per session.
Costs stored per-investigation for billing and governance reporting.

### 5.5 Model Governance

| Concern | Implementation |
|---|---|
| **Model switching** | One env var: `INFERENCE_PROVIDER=fireworks\|openai\|local\|mock` |
| **No code change required** | `get_inference_adapter()` factory reads env at startup |
| **Model name logged** | `adapter.get_model_name()` stored with every hypothesis record |
| **Provider logged** | `provider` field in every observability trace |
| **Prompt versioning** | Prompts in `ai_runtime/prompts/` as versioned template files |

---

## 6. Security Controls

### 6.1 Authentication

| Control | Implementation |
|---|---|
| **Algorithm** | HS256 JWT (upgradeable to RS256 via `JWT_ALGORITHM` env var) |
| **Secret rotation** | `JWT_SECRET_KEY` from environment, never in source code |
| **Access token lifetime** | 60 minutes (configurable via `JWT_ACCESS_TOKEN_EXPIRE_MINUTES`) |
| **Refresh token lifetime** | 7 days (configurable via `JWT_REFRESH_TOKEN_EXPIRE_DAYS`) |
| **Token claims** | `sub`, `org_id`, `role`, `jti` (UUID for revocation), `iat`, `exp` |
| **Password hashing** | bcrypt via `passlib[bcrypt]` with automatic cost factor |

### 6.2 Secrets Management

```bash
# All secrets via environment variables only. Never in code or Dockerfiles.
JWT_SECRET_KEY=$(python -c "import secrets; print(secrets.token_hex(32))")
POSTGRES_PASSWORD=<strong random password>
MINIO_ROOT_PASSWORD=<strong random password>
FIREWORKS_API_KEY=<from Fireworks AI console>
```

### 6.3 Network Isolation

```yaml
# docker-compose.yml security design:
services:
  db:
    # No 'ports:' section → database NOT exposed on host network
    networks: [helix_net]

  redis:
    # No 'ports:' section → Redis NOT exposed on host network
    networks: [helix_net]

  nginx:
    ports: ["80:80"]   # Only Nginx is externally accessible
    networks: [helix_net]
```

PostgreSQL and Redis are reachable only from within the `helix_net` Docker bridge.

### 6.4 API Security

| Control | Implementation |
|---|---|
| **CORS** | `CORS_ORIGINS` env var; defaults to localhost only |
| **Rate limiting** | `MAX_REQUESTS_PER_MINUTE=60` per IP |
| **File validation** | MIME type check + `MAX_EVIDENCE_FILE_SIZE_MB=50` on upload |
| **SQL injection** | All queries via SQLAlchemy ORM with parameterized statements |
| **Input validation** | Pydantic v2 schemas on all request bodies |
| **Error responses** | Structured `{"detail": "..."}` — no raw tracebacks exposed |
| **Dependency scanning** | `pip-audit`-compatible dependency set |

---

## 7. Compliance Roadmap

### Phase 1 — Complete (MVP / RC2)

- [x] JWT authentication with role claims embedded in token
- [x] RBAC with four roles enforced at router level via `RoleChecker`
- [x] Immutable audit log for all create/update/approve/delete/login events
- [x] `org_id` row-level multi-tenant isolation at ORM layer
- [x] Human approval required for every AI-generated CAPA
- [x] Citation grounding + hallucination rate tracking per investigation
- [x] Token cost tracking per AI call

### Phase 2 — Roadmap (3–6 months)

- [ ] SSO / SAML 2.0 (Okta, Azure AD, PingFederate)
- [ ] Data encryption at rest (PostgreSQL TDE or AES-256 at application layer)
- [ ] Field-level encryption for regulated data fields
- [ ] HTTPS / TLS termination at Nginx
- [ ] HashiCorp Vault or AWS Secrets Manager integration

### Phase 3 — Roadmap (6–18 months)

- [ ] SOC 2 Type II audit readiness package
- [ ] 21 CFR Part 11 formal validation (IQ/OQ/PQ documentation)
- [ ] ISO 27001 ISMS alignment
- [ ] ISO 13485 QMS documentation

---

## 8. Disaster Recovery

| Component | Backup Method | Recovery | RTO | RPO |
|---|---|---|---|---|
| **PostgreSQL** | `pg_dump` daily + WAL archiving | `pg_restore` to new instance | 4 hours | 1 hour |
| **MinIO** | Bucket replication to secondary MinIO or S3 | DNS failover | 2 hours | 15 min |
| **Redis** | Ephemeral — tolerable to lose | Container restart | 5 min | N/A |
| **Application** | Stateless container — rebuild from image | `docker compose up` | 30 min | N/A |

**RTO Target (MVP):** 4 hours | **RPO Target (MVP):** 1 hour

```bash
# Daily PostgreSQL backup (add to crontab on host):
docker compose exec db pg_dump -U helix helixdb \
  | gzip > /backups/helix_$(date +%Y%m%d_%H%M%S).sql.gz

# Restore:
gunzip -c /backups/helix_20240115.sql.gz \
  | docker compose exec -T db psql -U helix helixdb
```

---

## 9. Scalability

### 9.1 Current Architecture Constraints

| Component | Constraint | Scaling Path |
|---|---|---|
| FastAPI workers | 1 worker (sentence-transformers is in-process) | Set `EMBEDDING_MODEL=fireworks`, then scale to N workers |
| PostgreSQL | Single node | Read replicas → PgBouncer → managed PostgreSQL (RDS, Cloud SQL) |
| pgvector index | IVFFlat; good to ~500K vectors | HNSW index for 1M+ vectors with better recall |
| MinIO | Single node | Distributed MinIO (4+ nodes) or migrate to S3 |
| Document processing | Synchronous in request | Celery + Redis queue for async processing (roadmap) |

### 9.2 Horizontal Scaling Path

```
Phase 1 (now):     1 FastAPI container, EMBEDDING_MODEL=local
Phase 2:           N FastAPI replicas, EMBEDDING_MODEL=fireworks, Redis caching
Phase 3:           Kubernetes HPA, Celery workers for document ingestion
Phase 4:           Microservices: evidence-service, inference-service, audit-service
```

---

## 10. Observability

### 10.1 Current Capabilities

| Capability | Implementation |
|---|---|
| **Health endpoint** | `GET /api/health` → `{"status": "ok", "version": "...", "services": {...}}` |
| **Structured logging** | JSON logs with `trace_id` correlation field |
| **AI call tracing** | `trace_ai_operation()` context manager — start/end/duration/status |
| **Token cost logging** | `AIRuntimeTracker.record_call()` — provider/model/tokens/cost/latency |
| **Error tracking** | All exceptions caught at middleware; structured error responses |

### 10.2 Example AI Observability Log Entry

```json
{
  "timestamp": "2024-01-15T10:23:45.123Z",
  "level": "INFO",
  "logger": "helix.ai_runtime.observability",
  "message": "AI Call Recorded",
  "provider": "fireworks",
  "model": "accounts/fireworks/models/gemma4-31b-it",
  "prompt_tokens": 1842,
  "completion_tokens": 623,
  "cost_usd": 0.0031,
  "latency_ms": 3241.7,
  "trace_id": "a4b8c2d1-9f3e-4a12-b678-c90d1e2f3a4b"
}
```

### 10.3 Observability Roadmap

| Tool | Purpose | Status |
|---|---|---|
| OpenTelemetry | Distributed tracing | Roadmap |
| Prometheus | Metrics (request rate, latency p95/p99, token costs) | Roadmap |
| Grafana | Dashboards: AI cost, investigation throughput, error rate | Roadmap |
| Sentry | Exception tracking with full context | Roadmap |

---

*Maintained in `docs/Enterprise_Readiness.md` — update alongside any security or compliance changes.*
