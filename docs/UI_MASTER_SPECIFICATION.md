# Helix Master UI Specification

This document serves as the **authoritative frontend contract** for the Helix platform. It describes *implemented* behavior, not desired behavior. 

No UI component, drawer, badge, metric, timeline entry, recommendation, action, or workflow may exist unless it has:
- a canonical data source,
- a backend owner,
- an API contract,
- a runtime purpose,
- and a defined user value.

Every page, component, action, and state maps back sequentially:
**Organization Memory → Backend Model → Repository → API → React Hook → Component → Runtime State**

No orphan UI elements are permitted.

---

## 1. Runtime Behavior (The 1:1 Execution Flow)

The EvidenceOps execution pipeline translates directly into UI states. Every backend step has a dedicated, visible representation.

| Runtime Step | Canonical Data | Endpoint | React Hook | UI Component |
| :--- | :--- | :--- | :--- | :--- |
| **Context Load** | `Equipment`, `SOP` | `GET /api/investigations/{id}/context` | `useQuery(["context"])` | Intelligent Tracing Panel |
| **Upload Report** | `Evidence` | `POST /api/evidence/upload` | `useUploadEvidence` | Upload Drawer / Dropzone |
| **Assessment** | `Hypothesis`, `SOP` | `POST /api/investigations/{id}/hypotheses` | `useAssessInvestigation` | Assessment Engine Panel |
| **CAPA** | `CAPA` | `POST /api/investigations/{id}/capa` | `useGenerateCapa` | CAPA Action Panel |
| **Approval** | `CAPA` | `POST /api/capa/{id}/approve` | `useApproveCapa` | Approval Panel |

---

## 2. Implemented Backend Mapping (Entity to Component)

Every structural entity rendered on the screen maps strictly to an existing SQLAlchemy model in the backend, populated from the Canonical Organization Memory.

| Backend Entity (SQLAlchemy) | Canonical JSON Source | Frontend Component |
| :--- | :--- | :--- |
| **Investigation** | `N/A` (Runtime Created) | Investigation Workspace (Detail Page) |
| **Evidence** | `N/A` (Runtime Created) | Evidence Drawer |
| **Equipment** | `equipment/EQ-FIL-008.json` | Intelligent Tracing > Equipment Drawer |
| **SOP** | `sops/SOP-STER-014.json` | Intelligent Tracing > SOP Drawer |
| **KnowledgeRelationship** | `relationships/equipment_relationships.json` | Intelligent Tracing Lists |
| **CAPA** | `N/A` (Runtime Created) | CAPA Workflow Block |

---

## 3. UI State Mapping (Deterministic Transitions)

React state (`loading`, `success`, `error`) strictly reflects the Promise resolution of the Axios client.

| Backend State | UI State | Visual Feedback |
| :--- | :--- | :--- |
| Awaiting Input | Idle | "Waiting for Evidence" badge visible. |
| Processing (Network) | Loading | "Autonomous Assessment Running..." pulsating badge. |
| 201 Created | Success | Re-render with AI Assessment blocks (Facts, Reasoning, Gaps). |
| 400/403/500 | Error | Error boundary / Toast. |

---

## 4. Master Record Traceability

The frontend guarantees traceability. For every Entity rendered in the `DetailPanel`, the UI traces it backward:

**Equipment Drawer:**
Origin (`Detailed Equipment Files.pdf`) → Entity (`EQ-FIL-008.json`) → Backend Model (`src.knowledge.models.Equipment`) → API (`GET /context`) → Hook (`useQuery(contextData)`) → Component (`<DetailPanel detail={detail} contextData={contextData} />`)

**SOP Drawer:**
Origin (`Core SOPs (01-20).pdf`) → Entity (`SOP-STER-014.json`) → Backend Model (`src.knowledge.models.SOP`) → API (`GET /context`) → Hook (`useQuery(contextData)`) → Component (`<DetailPanel detail={detail} contextData={contextData} />`)

If a component cannot fulfill this entire chain, it is structurally rejected by the frontend architecture.
