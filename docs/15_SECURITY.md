# Security & Enterprise Readiness

Security is not an afterthought in Helix; it is the fundamental prerequisite for operating in highly regulated industries.

## Authentication & Authorization
- **JWT Authentication:** All API endpoints are secured via JSON Web Tokens.
- **Role-Based Access Control (RBAC):** Strict permissions model. 
  - *Operators* can upload evidence.
  - *Analysts* can trigger AI reasoning.
  - *QA Reviewers* are required to approve CAPAs.
  - *Admins* manage Organization Memory.

## Tenant Isolation
Helix uses a logical multi-tenancy model. Every table in the database contains an `org_id` foreign key. The `CurrentUser` dependency injected into FastAPI endpoints enforces `WHERE org_id = current_user.org_id` on every single database query, completely isolating tenant data.

## Auditability (Immutable Ledger)
Regulatory bodies (FDA, EMA) require 21 CFR Part 11 compliance. 
Helix maintains an `audit_logs` table. Every action—from logging in, to uploading a document, to the AI generating a hypothesis, to a human approving a CAPA—writes an append-only record to this table. 
*Future Roadmap:* v2.0 will introduce cryptographic hashing of these logs to prove mathematically that audit trails have not been tampered with by database administrators.

## Explainability (EvidenceOps)
Traditional AI systems are black boxes. If a regulator asks, "Why did the system recommend quarantining this batch?", a chatbot cannot provide a verifiable answer.
Helix achieves explainability by enforcing structured citations. The AI is structurally prevented from generating assertions without linking them back to a specific `document_chunk_id` in the Organization Memory or `evidence_id` from the investigation.

## Infrastructure Security
- **Internal Networks:** In the Docker Compose and Enterprise deployments, the Database, MinIO, and Redis containers do not expose ports to the host machine. They are only accessible via the internal `helix_net` Docker network.
- **Secrets Management:** Environment variables are used strictly. No secrets or API keys are committed to the repository.
