# API Reference

The Helix API is built on FastAPI and fully documented via OpenAPI. In development, the Swagger UI is available at `/docs`.

All endpoints are prefixed with `/api`.

## Authentication

**`POST /auth/login`**
- **Description:** Authenticates a user and returns a JWT token.
- **Request Body:** `{ "email": "user@example.com", "password": "password123" }`
- **Response (200):** `{ "access_token": "ey...", "token_type": "bearer" }`
- **Errors:** `401 Unauthorized` (Invalid credentials)

**`GET /auth/me`**
- **Description:** Retrieves the current authenticated user profile.
- **Headers:** `Authorization: Bearer <token>`
- **Response (200):** `{ "id": "uuid", "email": "user@...", "role": "admin", "org_id": "uuid" }`

## Investigations

**`GET /investigations`**
- **Description:** Lists all active investigations for the organization.
- **Response (200):** `[{ "id": "uuid", "title": "...", "status": "open", "severity": "high" }]`

**`POST /investigations/{id}/assess`**
- **Description:** Triggers the AI Verification Engine to assess evidence against the Organization Memory.
- **Request Body:** `{ "question": "Investigate root cause" }`
- **Response (201):** `{ "summary": "...", "facts": [...], "root_causes": [...] }`

## Evidence

**`POST /evidence/upload`**
- **Description:** Uploads a raw document to MinIO and indexes its metadata in PostgreSQL.
- **Request (Multipart):** `file`, `investigation_id`
- **Response (201):** `{ "id": "uuid", "original_filename": "...", "status": "processed" }`

## CAPA

**`POST /investigations/{id}/capa`**
- **Description:** Deterministically drafts a CAPA based on accepted hypotheses.
- **Request Body:** `{ "org_context": "..." }`
- **Response (201):** `{ "id": "uuid", "content": "JSON string", "status": "draft" }`
- **Errors:** `400 Bad Request` (If validation constraints fail).

**`POST /capa/{id}/approve`**
- **Description:** Human approval endpoint to finalize the CAPA and close the investigation.
- **Request Body:** `{ "approved": true }`
- **Response (200):** `{ "id": "uuid", "status": "approved" }`
