# Project Helix — Deployment & GxP Operations Guide

> **Release Version:** v1.0.0-hackathon (RC5 Submission Candidate)  
> **Classification:** Technical Operations (Restricted)  

---

## 1. Environment Variable Reference Matrix

The following table documents all environment variables required to run Project Helix in development and production environments.

| Variable Name | Description | Default / Example Value | Required in Production |
|---|---|---|---|
| **DATABASE_URL** | Async connection string for PostgreSQL | `postgresql+psycopg://helix:helix@db:5432/helixdb` | **Yes** |
| **POSTGRES_USER** | Database admin username | `helix` | **Yes** |
| **POSTGRES_PASSWORD** | Database admin password | `helix` | **Yes** |
| **POSTGRES_DB** | Target database name | `helixdb` | **Yes** |
| **SECRET_KEY** | JWT signing key (32-char hex minimum) | `89547d25e0b04a43...` | **Yes** |
| **ALGORITHM** | JWT signature algorithm | `HS256` | No (defaults to HS256) |
| **INFERENCE_PROVIDER** | AI Inference driver (`mock` \| `fireworks`) | `fireworks` | **Yes** |
| **FIREWORKS_API_KEY** | Fireworks AI API key | `fw_7Fr3pTjAE9Zwp1qE8rXbZN` | **Yes** (when using fireworks) |
| **FIREWORKS_MODEL** | Target model (Gemma 4 default fallback) | `accounts/fireworks/models/gemma-4-31b-it` | No (defaults to Gemma 4) |
| **EMBEDDING_PROVIDER** | Vector embedding driver (`local` \| `fireworks`) | `local` | No (defaults to local) |
| **EMBEDDING_MODEL_LOCAL** | Local SentenceTransformer model | `all-MiniLM-L6-v2` | No (defaults to MiniLM) |
| **MINIO_ROOT_USER** | Object storage admin username | `minioadmin` | **Yes** |
| **MINIO_ROOT_PASSWORD** | Object storage admin password | `minioadmin` | **Yes** |
| **MINIO_ENDPOINT** | S3 API endpoint host:port | `minio:9000` | **Yes** |
| **MINIO_SECURE** | Enable TLS/SSL connection to MinIO | `false` | **Yes** (set to true in prod) |

---

## 2. Production Deployment Sequence

For 100% first-attempt success, deploy services in the following order:

```
[1] Database (PostgreSQL + pgvector)
       ↓ (Wait for online status)
[2] Object Storage (MinIO / S3) & Cache (Redis)
       ↓ (Wait for online status)
[3] Database Migrations (Run Alembic upgrade head)
       ↓
[4] Backend Application API (FastAPI)
       ↓ (Check health endpoint /api/health)
[5] Reverse Proxy (Nginx) & Frontend SPA (React)
```

### Steps:
1.  **Deploy Database (Neon / Managed PostgreSQL)**: Ensure the `vector` extension is enabled (`CREATE EXTENSION IF NOT EXISTS vector;`).
2.  **Deploy Object Storage (MinIO / AWS S3)**: Create the three operational buckets:
    *   `helix-evidence` (Unstructured uploads)
    *   `helix-documents` (Processed chunks)
    *   `helix-exports` (Compiled PDF reports)
3.  **Run Database Migrations**: Run the schema bootstrap command from the backend directory:
    ```bash
    alembic upgrade head
    ```
4.  **Launch Backend Services**: Bind the FastAPI backend. Test connectivity to PostgreSQL and MinIO using `GET /api/health`.
5.  **Serve Frontend SPA**: Build static React assets using `npm run build` and route through Nginx reverse proxy.

---

## 3. Database Migration Commands

Helix uses **Alembic** to manage database schema updates.

*   **Initialize database schema from scratch**:
    ```bash
    alembic upgrade head
    ```
*   **Generate a new migration script**:
    ```bash
    alembic revision --autogenerate -m "describe_changes_here"
    ```
*   **Roll back the last migration**:
    ```bash
    alembic downgrade -1
    ```
*   **Check migration status**:
    ```bash
    alembic current
    ```

---

## 4. Rollback & Disaster Recovery Procedures

### 1. Database Schema Rollback
If a migration introduces a breaking change:
1.  Stop the backend service to prevent connection lockouts.
2.  Execute the Alembic downgrade command:
    ```bash
    alembic downgrade -1
    ```
3.  Restart the backend service.

### 2. Container Lifecycle Rollback
If a newly deployed image fails health checks:
1.  Downgrade the container version in `docker-compose.yml` or your orchestrator config.
2.  Trigger a rolling restart:
    ```bash
    docker compose up -d --build --force-recreate backend
    ```

### 3. Hotfix Code Rollback
To revert the git branch to the last stable tagged release:
```bash
git checkout tags/v1.0.0-hackathon
```

---

## 5. Post-Deployment Verification Checklist

Run these validation commands immediately after completing any deployment:

- [ ] **Health Probe**: Verify backend responds with healthy code:
  ```bash
  curl -f http://localhost/api/health
  ```
- [ ] **Database Connection Check**: Check logs to verify pgvector queries are executing without timeouts.
- [ ] **Storage Probe**: Verify file uploads compile. Run:
  ```bash
  python scripts/health_check.py
  ```
- [ ] **Inference Check**: Verify connection to the Fireworks Instinct GPU cluster:
  ```bash
  python scripts/verify_system_fireworks.py
  ```
