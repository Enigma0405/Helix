# Database Architecture

Helix utilizes a unified PostgreSQL 17 database, leveraging the `pgvector` extension to store semantic embeddings alongside relational metadata.

## Core Schema

### Organizations & Users
- **`organizations`**: Multi-tenant isolation.
  - `id` (UUID, PK)
  - `name` (String)
- **`users`**: RBAC and authentication.
  - `id` (UUID, PK)
  - `org_id` (UUID, FK)
  - `email` (String, Unique)
  - `role` (Enum: admin, analyst, reviewer, user)
  - `hashed_password` (String)

### Knowledge Base (Organization Memory)
- **`documents`**: Canonical enterprise documents (SOPs, Equipment Manuals).
  - `id` (UUID, PK)
  - `org_id` (UUID, FK)
  - `title`, `source_type`, `version`
- **`document_chunks`**: Segmented text blocks embedded for semantic search.
  - `id` (UUID, PK)
  - `document_id` (UUID, FK)
  - `content` (Text)
  - `embedding` (Vector: 768 dimensions)

### Operational Pipeline
- **`investigations`**: The core operational event entity.
  - `id` (UUID, PK)
  - `org_id` (UUID, FK)
  - `title`, `description`, `status`, `severity`
- **`evidence`**: Raw files attached to investigations.
  - `id` (UUID, PK)
  - `investigation_id` (UUID, FK)
  - `storage_key` (MinIO reference path)
  - `content_hash` (SHA-256 for immutability)

### Reasoning & Actions
- **`hypotheses`**: Intermediate AI reasoning steps.
  - `id` (UUID, PK)
  - `investigation_id` (UUID, FK)
  - `title`, `description`, `confidence_score`
- **`capas`**: The final output action plan.
  - `id` (UUID, PK)
  - `investigation_id` (UUID, FK)
  - `content` (Text/JSON)
  - `status` (Enum: draft, approved)
- **`audit_logs`**: Immutable ledger of all system actions.
  - `id` (UUID, PK)
  - `action`, `entity_type`, `entity_id`
  - `actor_id` (UUID, FK)
  - `timestamp`
