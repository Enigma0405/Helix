# Helix Runtime Architecture — EvidenceOps Execution Engine

This document provides a highly detailed mapping of the Helix execution runtime. It defines the behavioral models, system topology, data structures, and enterprise guarantees necessary to operate an AI-native Enterprise Operating System in highly regulated industries.

---

## 1. Runtime Principles

The Helix engine operates under a strict set of deterministic principles:
* Everything entering Helix is treated as an **Operational Event**.
* Every event is parsed into structured knowledge.
* AI never reasons without evidence.
* Every conclusion references supporting evidence.
* Every decision is explainable.
* Humans remain accountable for regulated decisions.
* Every completed investigation strengthens Organization Memory.

---

## 2. The EvidenceOps Operating Model

Unlike a standard CRUD application, the Helix architecture is designed as a continuous loop of verification, reasoning, and archival.

```mermaid
flowchart TD
    E1[Operational Event] --> E2[Event Parser]
    E2 --> E3[Entity Extraction]
    E3 --> E4[Relationship Mapping]
    E4 --> E5[Organization Memory]
    E5 --> E6[AI Cross Verification]
    E6 --> E7[Operational Signal]
    E7 --> E8[Investigation Context]
    E8 --> E9[Evidence Correlation]
    E9 --> E10[Reasoning]
    E10 --> E11[Assessment]
    E11 --> E12[CAPA]
    E12 --> E13[Human Review]
    E13 --> E14[Historical Learning]
    E14 -->|Loop Closed| E5
```

---

## 3. Runtime Execution Pipeline

When an operational event breaches safety thresholds, the execution pipeline automatically triggers a deterministic sequence bridging human input, the `pgvector` knowledge graph, and the Fireworks AI inference engine.

```mermaid
sequenceDiagram
    participant UI as Client UI
    participant Auth as Auth API
    participant Inv as Investigation API
    participant Evid as Evidence API
    participant AI as AI Runtime API
    participant DB as PostgreSQL / pgvector
    participant S3 as MinIO

    %% Auth
    UI->>Auth: POST /auth/login (email, password)
    Auth->>DB: Verify credentials
    Auth-->>UI: JWT Bearer Token

    %% Initialization
    UI->>Inv: POST /api/investigations (Operational Signal triggered)
    Inv->>DB: INSERT INTO investigations
    Inv-->>UI: 201 Created (investigation_id)

    %% Evidence Ingestion
    UI->>Evid: POST /api/evidence/upload (file, investigation_id)
    Evid->>S3: PutObject(file_bytes)
    Evid->>DB: INSERT INTO evidence (storage_key, hash)
    Evid->>DB: INSERT INTO audit_logs (action='upload')
    Evid-->>UI: 201 Created (evidence_id)

    %% AI Cross-Verification (Assessment)
    UI->>AI: POST /api/investigations/{id}/hypotheses
    AI->>DB: SELECT document_chunks WHERE vector matches query
    AI->>DB: SELECT evidence content
    AI->>AI: Build Context Prompt
    AI->>Fireworks AI: Execute Inference (Structured JSON)
    Fireworks AI-->>AI: Deterministic Root Cause Hypotheses
    AI->>DB: INSERT INTO hypotheses
    AI->>DB: INSERT INTO audit_logs
    AI-->>UI: 201 Created [Hypotheses List]

    %% CAPA Generation
    UI->>AI: POST /api/investigations/{id}/capa
    AI->>DB: SELECT accepted hypotheses
    AI->>Fireworks AI: Generate Action Plan (Structured JSON)
    Fireworks AI-->>AI: Draft CAPA
    AI->>DB: INSERT INTO capas (status='draft')
    AI-->>UI: 201 Created (CAPA Object)

    %% Human Approval
    UI->>AI: POST /api/capa/{id}/approve
    AI->>DB: UPDATE capas SET status='approved'
    AI->>DB: UPDATE investigations SET status='closed'
    AI->>DB: INSERT INTO audit_logs
    AI-->>UI: 200 OK (Investigation Closed)
```

---

## 4. AI Agent Execution Flow

To process complex quality investigations autonomously, Helix orchestrates specialized reasoning agents synchronously within the runtime.

```mermaid
flowchart TD
    A1(Event Received) --> A2[Evidence Agent]
    A2 --> A3[Knowledge Agent]
    A3 --> A4[Timeline Agent]
    A4 --> A5[Root Cause Agent]
    A5 --> A6[Confidence Agent]
    A6 --> A7[Risk Agent]
    A7 --> A8[CAPA Agent]
    A8 --> A9[Compliance Agent]
    A9 --> A10(Executive Summary)
```

---

## 5. Strict Relational Data Pointers

To render the architecture seamlessly on any interface, the UI must respect the backend's strict foreign key relationships and multi-tenant isolation. Every entity relies heavily on UUID pointers.

```mermaid
erDiagram
    ORGANIZATIONS ||--o{ USERS : "has many"
    ORGANIZATIONS ||--o{ INVESTIGATIONS : "owns"
    ORGANIZATIONS ||--o{ DOCUMENTS : "owns"
    
    INVESTIGATIONS ||--o{ EVIDENCE : "collects"
    INVESTIGATIONS ||--o{ HYPOTHESES : "generates"
    INVESTIGATIONS ||--o{ CAPAS : "resolved_by"
    INVESTIGATIONS ||--o{ AUDIT_LOGS : "tracked_in"

    DOCUMENTS ||--o{ DOCUMENT_CHUNKS : "split_into"
    USERS ||--o{ AUDIT_LOGS : "performs"

    USERS {
        uuid id PK
        uuid org_id FK "Must match token org_id"
        string role "Enum: admin, analyst, reviewer, user"
    }

    INVESTIGATIONS {
        uuid id PK
        uuid org_id FK
        string status "Enum: open, in_progress, closed"
    }

    EVIDENCE {
        uuid id PK
        uuid investigation_id FK
        string storage_key "Pointer to MinIO bucket"
    }

    DOCUMENT_CHUNKS {
        uuid id PK
        uuid document_id FK
        vector embedding "768-d vector for similarity search"
    }
```

---

## 6. Confidence Engine

Helix does not rely on subjective AI hallucination. The **Confidence Score** is mathematically derived from the following vectors during the runtime execution:
* **Evidence Coverage:** Percentage of the operational event corroborated by physical data logs.
* **Historical Similarity:** Proximity vector to historical CAPAs within the Organization Memory.
* **Cross Verification Success:** Validation against active SOP thresholds.
* **Regulatory Alignment:** Verification against relevant regulatory citations (e.g., 21 CFR 211).
* **Missing Evidence Penalty:** Deductions applied if chronological links in the chain-of-custody are absent.
* **Contradiction Penalty:** Deductions applied if raw evidence conflicts with stated human hypotheses.

---

## 7. Explainability Contract

To maintain 21 CFR Part 11 and general regulatory compliance, every AI inference passed through the Helix engine is bound by an Explainability Contract. Every structured JSON output from the Fireworks API MUST include:

```json
{
  "evidence_used": ["..."],
  "knowledge_referenced": ["..."],
  "reasoning_steps": ["..."],
  "confidence": 0.88,
  "evidence_gaps": ["..."],
  "alternative_hypotheses": ["..."],
  "recommended_actions": ["..."]
}
```

---

## 8. Enterprise Runtime Guarantees

Any UI framework connecting to the Helix backend must adhere to the following guarantees established by the FastAPI routing layer:

* **Tenant Isolation:** The frontend NEVER transmits an `org_id`. The backend infers isolation directly from the cryptographic JWT, guaranteeing zero data bleed between tenants.
* **Immutable Audit Trail:** There are no `DELETE` or `PUT` endpoints exposed for Audit Logs or finalized evidence. The runtime strictly rejects mutations to historical facts.
* **Explainability:** All AI assertions maintain a foreign-key pointer back to the raw `document_chunk_id` that inspired them.
* **Human Approval:** The runtime structurally prevents an Investigation status from changing to `closed` without a `POST /approve` call bound to a human actor's UUID.
* **Role-Based Access Control (RBAC):** Inference generation requires `analyst` privileges; CAPA approvals require `reviewer` privileges. 
* **Traceability:** Every mutation is chronologically written to the `audit_logs` relation before 201 responses are sent.
* **Event Sourcing:** The current state of an investigation is inherently reproducible by re-running its audit log from inception.

---

## 9. The Behavioral Contract

Helix does not automate regulated decisions. It automates evidence collection, verification, correlation, and reasoning while ensuring every conclusion remains transparent, traceable, and evidence-backed. Human users remain accountable for approvals, while every completed investigation enriches Organization Memory and improves future investigations.
