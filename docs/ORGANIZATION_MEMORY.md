# Organization Memory Mapping

This document bridges the raw knowledge ingestion to the frontend user interface, establishing absolute traceability.

## The Extraction Pipeline

### 1. Raw Knowledge to Canonical Entities

| Knowledge Document | Extracted Entity | Canonical JSON |
| :--- | :--- | :--- |
| `Core SOPs (01–20).pdf` | SOP-STER-014 (Sterilization Procedures) | `sops/SOP-STER-014.json` |
| `Detailed Equipment Files.pdf` | EQ-FIL-008 (Sterile Filter Emflon II) | `equipment/EQ-FIL-008.json` |

### 2. Canonical Entities to Backend Models

| Canonical JSON | Backend SQLAlchemy Model | Database Table |
| :--- | :--- | :--- |
| `equipment/*.json` | `src.knowledge.models.Equipment` | `equipment` |
| `sops/*.json` | `src.knowledge.models.SOP` | `sops` |
| `relationships/*.json` | `src.knowledge.models.KnowledgeRelationship` | `knowledge_relationships` |

### 3. Backend Models to API

| Database Table | Backend Router / Service | REST API Endpoint |
| :--- | :--- | :--- |
| `equipment`, `sops`, `knowledge_relationships` | `src.investigation.router.get_investigation_context` | `GET /api/investigations/{id}/context` |

### 4. API to React Hook to UI Component

| REST API Endpoint | React Hook | UI Component |
| :--- | :--- | :--- |
| `GET /api/investigations/{id}/context` | `useQuery(["investigations", id, "context"])` | `InvestigationDetailPage.tsx` (Intelligent Tracing OrgGroup) |
| `GET /api/investigations/{id}/context` | `useQuery(["investigations", id, "context"])` | `DetailPanel` (Equipment Profile Drawer) |
| `GET /api/investigations/{id}/context` | `useQuery(["investigations", id, "context"])` | `DetailPanel` (SOP Drawer) |
