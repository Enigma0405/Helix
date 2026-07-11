# Organization Structure & Data Boundaries

This document defines the strict data boundaries for enterprise organizations within the Helix platform.

## 1. Directory Breakdown

Each organization (e.g., `organizations/apex_precision/`) contains the following strict subdirectories:

### `organization_seed/`
**Purpose:** Stores stable organizational reference knowledge. This represents the "truth" of the enterprise's current operational state.
- **Belongs Here:** SOPs, Policies, Equipment lists, Product specifications, Department structures, Employee rosters, Suppliers, Templates, and Manufacturing Processes.
- **NEVER Belongs Here:** Investigations, CAPAs, batch records, complaints, or transient evidence.

### `historical_memory/`
**Purpose:** Stores closed historical operational records. These act as historical context for similarity search, root cause analysis, and trend matching.
- **Belongs Here:** Completed historical investigations, finalized CAPAs, audit reports, deviations, and batch records.
- **NEVER Belongs Here:** Active ongoing investigations or raw, unapproved drafts.

### `demo_evidence/`
**Purpose:** Stores raw documents and events that simulate live incoming data during platform demonstrations. 
- **Belongs Here:** Simulated incoming emails, uploaded PDF evidence, LIMS error printouts.
- **NEVER Belongs Here:** Pre-ingested knowledge or historical records.

### `manifests/`
**Purpose:** Stores tracking manifests generated during ingestion (e.g., `knowledge_manifest.json`) detailing what was successfully processed.

---

## 2. Intended Ingestion Flow

The ingestion pipeline will pull from these directories systematically:

1. **Discovery**: The ingestion pipeline scans `organization_seed/` and `historical_memory/` for new or updated files based on file hashes (idempotent).
2. **Parsing & Validation**: Files are parsed, classified by type (e.g., SOP vs. Equipment), and validated against strict schemas without LLM hallucination.
3. **Normalization**: The validated data is mapped into Canonical JSON format.
4. **Persistence**: The resulting Canonical JSON is stored into the backend `organization_memory/` domain. Embeddings are generated and stored in the `knowledge/` domain for semantic search.
5. **Manifest Generation**: A `knowledge_manifest.json` is output to the `manifests/` folder to track completion.

> **CRITICAL RULE:** `docs/` is exclusively for developer and platform engineering documentation. It is completely isolated from the ingestion pipeline and must never be treated as organizational data.
