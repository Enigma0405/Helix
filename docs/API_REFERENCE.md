# API Reference

Helix provides a RESTful API powered by FastAPI.

## Complete OpenAPI Documentation
A complete, interactive OpenAPI (Swagger) documentation interface is automatically generated and available when the backend server is running.

**To view the full API spec, start the backend server and navigate to:**
```
http://localhost:8000/docs
```

---

## High-Level Overview

### Authentication
Currently, the MVP relies on a mocked `CurrentUser` dependency for demonstration purposes, bypassing strict JWT validation.
In production, all endpoints will require a valid Bearer token passed in the `Authorization` header.

### Core Endpoints

#### `GET /api/investigations/{id}/context`
Retrieves the Canonical Organization Memory (Equipment and SOPs) associated with an investigation. 

#### `POST /api/evidence/upload`
Accepts multipart form data (PDFs, logs, images) and ingests it into the Investigation Workspace.

#### `POST /api/investigations/{id}/hypotheses`
Invokes the Intelligence Layer to generate an Evidence-Backed Assessment (Facts, Gaps, Conflicts, Reasoning) using Fireworks AI.

#### `POST /api/investigations/{id}/capa`
Auto-drafts a 3-step Corrective and Preventive Action plan based on the generated assessment.

#### `POST /api/capa/{id}/approve`
Executes the final human approval gate, closing the investigation and logging it into the immutable audit timeline.
