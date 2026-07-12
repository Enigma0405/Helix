# Helix Feature Matrix

## Core Platform
- [x] **Mission Control Dashboard:** Centralized view of all operational anomalies and investigations.
- [x] **Investigation Workspace:** 3-column EvidenceOps layout (Evidence, Reasoning, Organization Context).
- [x] **Signal Prioritization:** Visual tagging of risk levels (Critical, Major, Minor, OK).

## Organization Memory
- [x] **Relational Schema:** Custom SQLAlchemy models mapping Equipment, Personnel, SOPs, and Batches.
- [x] **Vector Knowledge Base:** `pgvector` implementation for semantic search over facility assets.
- [x] **Intelligent Tracing:** Dynamic UI binding that traces evidence to physical facility locations (e.g., FAC-BOS-01) and specific personnel.

## Intelligence Layer (AI)
- [x] **Fireworks AI Integration:** `InferenceAdapter` pattern successfully routing to `accounts/fireworks/models/gemma-4-31b-it`.
- [x] **Structured Reasoning:** AI engine strictly outputs JSON facts and gaps, preventing conversational hallucinations.
- [x] **RCA Generation:** AI drafts Root Cause Analysis based on uploaded evidence vs. historical SOPs.
- [x] **CAPA Strategy Builder:** AI automatically proposes a 3-step strategy (Containment, Prevention, Closure).

## Infrastructure & DevOps
- [x] **Full Containerization:** Docker Compose setup for Postgres, Redis, MinIO, Backend, Frontend, and Nginx.
- [x] **API Gateway:** Nginx reverse proxy configuration for seamless frontend-to-backend routing.

## Demo Environment (Hackathon Scope)
To ensure a flawless presentation and accommodate API rate limits, the following elements are intentionally mocked or seeded in the current MVP branch:
- **Authentication:** Simulated login acting as "Jennifer Martinez, QA Director" for the tenant "Aetheris BioPharma".
- **Live Evidence Upload:** The frontend simulates the MinIO S3 upload delay.
- **Assessment Generation:** The AI logic is hardcoded to return a specific RCA relating to SOP-STER-014 and EQ-FIL-008 to guarantee sub-second response times during the live pitch. 

*(Note: The actual `FireworksAdapter` and `pgvector` query logic is fully implemented in the backend `ai_runtime` module and can be toggled via the `INFERENCE_PROVIDER` env variable).*
