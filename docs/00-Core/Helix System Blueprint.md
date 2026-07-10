# PROJECT HELIX: SYSTEM BLUEPRINT
**Phase 0.5: Enterprise EvidenceOps Architecture**

**Document ID:** HELIX-DOC-002

> [!IMPORTANT]
> This document defines *how* the Helix Experience Blueprint is made possible. It outlines the core orchestration engine, the event-driven architecture, the AI workforce communication, and the enterprise memory model. This is the foundational architecture for the EvidenceOps category.

---

## 1. Helix Core Intelligence

**Architectural Paradigm: Event-Driven Agentic Orchestration**
Helix is not a sequential workflow application; it is an active, stateful intelligence engine. The Core Intelligence operates on an **Event-Driven Architecture (EDA)** coupled with a **Hierarchical Agentic Orchestrator**. 

*   **Autonomous Investigations**: Investigations are not forms to be filled; they are state machines running in the background. When an anomaly is detected, the core intelligence provisions a dedicated "Investigation State Context."
*   **AI Coordination**: The Core Intelligence acts as a central control plane. It does not run LLM prompts directly. Instead, it listens to the Event Bus, manages the state of the investigation, and dispatches tasks to specialized AI workers asynchronously. It aggregates their outputs and resolves conflicts before presenting a unified case file to humans.

---

## 2. AI Orchestrator

The AI Orchestrator (The Conductor) manages the lifecycle of every investigation and the execution of the AI workforce.

*   **Triggers**: System webhooks (SCADA/ERP alarms), email ingestion, manual user creation.
*   **State Machine**:
    *   `DRAFT` (Initial ingestion)
    *   `GATHERING_EVIDENCE` (Evidence Agent active)
    *   `REASONING` (Knowledge, Root Cause, Timeline Agents active)
    *   `WAITING_ON_HUMAN` (Missing evidence requested or conflict detected)
    *   `REVIEW_PENDING` (CAPA drafted, waiting QA sign-off)
    *   `APPROVED` (Cryptographically signed)
*   **Events**: The Orchestrator strictly consumes and emits events to the Event Bus. It is completely decoupled from the frontend.
*   **Retries & Fallback**: If an AI worker times out or returns a malformed schema (e.g., failed JSON parsing), the Orchestrator automatically retries up to 3 times. If it fails, it falls back to a simpler, less deterministic model, or halts and escalates to a human with a `System Alert`.
*   **Human Checkpoints**: The Orchestrator halts execution and switches state to `WAITING_ON_HUMAN` when confidence thresholds drop below 75%, or when critical required evidence (defined by the Compliance Agent) is missing.

---

## 3. AI Workforce

The AI Workforce is a fleet of decoupled, stateless micro-agents. 

### Evidence Agent
*   **Inputs**: Raw unstructured data (PDFs, logs, emails), Event: `EvidenceUploaded`.
*   **Outputs**: Structured JSON metadata (Entities, Timestamps).
*   **Memory**: Short-term context of the current file being processed.
*   **Events Emitted**: `EvidenceProcessed`, `MissingEvidenceDetected`.
*   **Failure Handling**: Flags document as `Unprocessable`; alerts human.

### Timeline Agent
*   **Inputs**: Array of structured evidence items; Event: `EvidenceProcessed`.
*   **Outputs**: Chronological array of events.
*   **Events Emitted**: `TimelineUpdated`, `TimelineConflictDetected`.

### Knowledge Agent
*   **Inputs**: Investigation metadata; Event: `InvestigationCreated`, `EvidenceProcessed`.
*   **Outputs**: Vector IDs of top-K similar historical investigations and relevant SOPs.
*   **Memory**: Read-only access to the Enterprise Vector Database.
*   **Events Emitted**: `KnowledgeRetrieved`.

### Root Cause Agent
*   **Inputs**: Timeline, Knowledge, Evidence Graph; Event: `ReasoningRequested`.
*   **Outputs**: Structured hypotheses with confidence scores and rationale.
*   **Dependencies**: Requires Timeline and Knowledge Agents to complete first.
*   **Events Emitted**: `HypothesesGenerated`.

### CAPA Agent
*   **Inputs**: Primary Hypothesis (Approved by QA or High Confidence); Event: `HypothesisSelected`.
*   **Outputs**: Actionable steps, Risk Matrix.
*   **Events Emitted**: `CAPADrafted`.

### Compliance Agent
*   **Inputs**: Drafted CAPA, Deviation details; Event: `CAPADrafted`.
*   **Outputs**: Pass/Fail against CFR/ISO regulations.
*   **Events Emitted**: `ComplianceCheckPassed`, `ComplianceCheckFailed`.

### Confidence Agent (The Critic)
*   **Inputs**: All outputs from Root Cause Agent; Event: `HypothesesGenerated`.
*   **Outputs**: A mathematical confidence score (0-100%) and a "Next Best Action" string (e.g., "Need calibration cert to reach 90%").
*   **Events Emitted**: `ConfidenceUpdated`.

---

## 4. Event Bus

The nervous system of Helix. All components communicate via asynchronous pub/sub (e.g., Kafka, AWS EventBridge, or Redis PubSub).

**Core Events:**
*   `DeviationCreated`
*   `EvidenceUploaded`
*   `EvidenceProcessed`
*   `AIWorkerStarted` (Includes Worker ID and Task)
*   `AIWorkerCompleted`
*   `AIWorkerFailed`
*   `EvidenceMissingRequested`
*   `ConfidenceUpdated`
*   `HypothesesGenerated`
*   `CAPADrafted`
*   `ApprovalRequired`
*   `ApprovalComplete`
*   `KnowledgeGraphUpdated`

---

## 5. Enterprise Memory

Helix utilizes a tiered memory architecture to maintain context across time and space.

*   **Current Investigation Memory**: In-memory Redis cache (or ephemeral Postgres JSONB) holding the active context window, timeline, and current agent scratchpads.
*   **Historical Investigations Memory**: Vector Database (e.g., Pinecone, pgvector) containing semantic embeddings of all past, closed investigations.
*   **Organization Memory**: Graph Database (e.g., Neo4j) mapping the physical reality of the company (Facilities → Rooms → Equipment → Operators).
*   **Regulatory Memory**: Read-only RAG layer containing current FDA CFRs, ISO standards, and internal SOPs.
*   **Reviewer Memory**: The system remembers the editing behavior of specific QA Managers (e.g., "Manager X always requests more detail on valve failures").
*   **Knowledge Memory**: The finalized, immutable Postgres relational tables (the source of truth).

---

## 6. Knowledge Graph

To reason effectively, Helix must understand relationships. The Knowledge Graph maps the enterprise.

*   **Nodes**: 
    *   `Investigation`
    *   `Evidence` (Subtypes: Log, Statement, Photo, Cert)
    *   `Equipment`
    *   `Person` (Operator, Reviewer)
    *   `SOP` / `Regulation`
*   **Edges**:
    *   `Investigation` → [HAS_EVIDENCE] → `Evidence`
    *   `Evidence` → [MENTIONS] → `Equipment`
    *   `Equipment` → [OPERATED_BY] → `Person`
    *   `Investigation` → [SIMILAR_TO] → `Investigation` (Historical)
    *   `Investigation` → [VIOLATES] → `SOP`
*   **Similarity & Links**: Edges like `SIMILAR_TO` are dynamically generated by the Knowledge Agent based on cosine similarity in the vector space, not manual tagging.

---

## 7. Automation Engine

**What is strictly automated:**
*   Ingestion of machine alarms to create drafts.
*   Vector search for historical context.
*   Timeline generation from timestamps.
*   Drafting of root cause hypotheses.
*   Routing to the correct human approver based on risk score.
*   Generation of audit trail logs (21 CFR Part 11 compliant).

**What strictly requires humans:**
*   Supplying physical or undocumented evidence.
*   Selecting or modifying the final root cause.
*   Signing off on the CAPA.
*   Performing the physical CAPA actions.
*   Signing off on effectiveness checks.

---

## 8. Human Workflow

*   **Inbox**: A prioritized queue sorted by `Actionability` and `Risk`, not chronologically. Investigations waiting on AI reasoning are hidden from the human inbox until they reach `REVIEW_PENDING` or `WAITING_ON_HUMAN`.
*   **Tasks**: Micro-actions (e.g., "Upload Calibration Cert for Bio-B"). Humans do not need to open the full investigation to complete a task.
*   **Notifications**: Pushed via WebSocket to the UI and via API to MS Teams/Email. Triggered by `ApprovalRequired` or `EvidenceMissingRequested` events.
*   **Approvals & Escalations**: Configurable SLA timers on the state machine. If an `ApprovalRequired` event sits for > 48 hours, it escalates to the next managerial tier.

---

## 9. AI Runtime

The AI Runtime is the real-time execution layer, visible to the user to build trust.

*   **Reasoning Progress**: Exposed to the frontend via WebSockets. Users see a live stream of which agent is currently active.
*   **Agent Status**: `IDLE`, `PROCESSING`, `BLOCKED`, `COMPLETE`.
*   **Queue & Latency**: Agents execute asynchronously. The Orchestrator handles rate-limiting to LLM providers to prevent 429 errors.
*   **Provider Fallback**: A Router Layer sits between agents and LLMs. Primary: Anthropic Claude 3.5 Sonnet. Fallback: OpenAI GPT-4o. If rate-limited, requests gracefully queue.
*   **Confidence Updates**: Streamed incrementally. As the `Confidence Agent` finishes a pass, the UI's confidence meter updates in real-time.

---

## 10. Enterprise Dashboard

The dashboard is designed for decisions, not data exploration.

*   **Executive Decisions**: "Where is my systemic risk?" (e.g., "Approve $50k budget for new equipment based on 3 recurring high-risk deviations").
*   **QA Manager Decisions**: "Is my team keeping up with closure SLAs?" and "Are our CAPAs actually preventing recurrence?"
*   **Analyst Decisions**: "What is the single most important investigation I need to unblock right now?" (e.g., An investigation stalled at 90% confidence waiting for one document).

---

## 11. Golden Workflow (Technical Sequence)

1.  **SCADA System** fires Webhook to Helix API.
2.  Helix API publishes `DeviationCreated`.
3.  **Orchestrator** consumes event, provisions Investigation Context, sets state to `GATHERING_EVIDENCE`.
4.  **Evidence Agent** consumes `DeviationCreated`, pulls attached logs, publishes `EvidenceProcessed`.
5.  **Knowledge Agent** consumes `EvidenceProcessed`, performs vector search, publishes `KnowledgeRetrieved`.
6.  **Timeline Agent** consumes `EvidenceProcessed`, publishes `TimelineUpdated`.
7.  **Orchestrator** detects all gathering events complete, transitions state to `REASONING`, publishes `ReasoningRequested`.
8.  **Root Cause Agent** consumes `ReasoningRequested`, executes inference, publishes `HypothesesGenerated`.
9.  **Confidence Agent** consumes `HypothesesGenerated`, calculates 94%, publishes `ConfidenceUpdated`.
10. **CAPA Agent** consumes `HypothesesGenerated`, publishes `CAPADrafted`.
11. **Compliance Agent** consumes `CAPADrafted`, publishes `ComplianceCheckPassed`.
12. **Orchestrator** transitions state to `REVIEW_PENDING`, publishes `ApprovalRequired`.
13. **Human** (QA Analyst) receives WebSocket notification, reviews UI, clicks Approve (Cryptographic hash generated).
14. API publishes `ApprovalComplete`.
15. **Orchestrator** transitions state to `APPROVED`, finalizes Knowledge Graph embeddings.

---

## 12. MVP Boundary

To prevent scope creep, the implementation is strictly bounded.

**Must Build Now (Hackathon MVP):**
*   FastAPI backend with basic state machine.
*   PostgreSQL + simple pgvector implementation for memory.
*   Synchronous or lightweight async agent orchestration (Python `asyncio` or basic Celery).
*   Evidence Agent, Knowledge Agent, and Root Cause Agent.
*   The "Golden Workflow" sequence from ingestion to QA Review.
*   AI Runtime Panel (Streaming logs to UI).

**Build After Hackathon (V1.0):**
*   Full Kafka/EventBridge Event Bus.
*   Compliance Agent and Risk Agent.
*   True Neo4j Knowledge Graph.
*   Multi-tier Executive Approvals.
*   Complex retry/fallback router for LLM providers.

**Future Roadmap (V2.0):**
*   Direct SCADA/IoT edge integrations.
*   Predictive anomaly detection (preventing deviations before they happen).
*   Global regulatory cross-referencing (automatic translations of foreign regulatory actions).

