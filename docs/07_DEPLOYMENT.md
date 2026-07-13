# Deployment Guide

Helix is designed to be highly portable. It can be deployed in a fully cloud-native configuration (for fast iteration and demo purposes) or fully containerized on-premise (for strict enterprise data sovereignty).

## Cloud-Native Deployment (Hackathon/Demo Setup)

### 1. Frontend (Vercel)
The React SPA is deployed directly via Vercel.
- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Environment Variables:**
  - `VITE_API_URL`: Points to the hosted backend URL (e.g., `https://api.helix.example.com`)

### 2. Backend (Render)
The FastAPI backend is deployed as a Web Service on Render using the provided `Dockerfile`.
- **Environment:** Docker
- **Build Command:** Built natively from `backend/Dockerfile`
- **Start Command:** `uvicorn src.main:app --host 0.0.0.0 --port 10000`
- **Environment Variables:**
  - `DATABASE_URL`: Connection string to Neon PostgreSQL.
  - `FIREWORKS_API_KEY`: API key for inference.
  - `MINIO_ENDPOINT`: URL to cloud S3 bucket (or mocked for demo).
  - `JWT_SECRET_KEY`: Cryptographic signing key.

### 3. Database (Neon / AWS RDS)
We use Neon (serverless Postgres) for fast, cloud-native deployments with `pgvector` enabled out-of-the-box.
- Ensure the `pgvector` extension is created:
  ```sql
  CREATE EXTENSION IF NOT EXISTS vector;
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  ```

---

## On-Premise Deployment (Enterprise Setup)

For highly regulated environments (e.g., pharmaceutical cleanrooms), Helix is deployed entirely within the corporate intranet using Docker Compose or Kubernetes.

### Prerequisites
- Docker Engine 24.0+
- Docker Compose v2.0+
- AMD ROCm compatible host (optional, for local inference)

### Steps
1. Clone the repository to the host machine.
2. Configure the `.env` file at the project root based on `.env.example`.
3. Start the cluster:
   ```bash
   docker-compose up -d --build
   ```

### Architecture in Docker Compose
- **`helix_nginx`**: Listens on Port 80. Routes `/api` traffic to backend, and `/` traffic to frontend.
- **`helix_backend`**: Internal FastAPI container.
- **`helix_frontend`**: Internal Vite/Nginx container serving static assets.
- **`helix_db`**: Internal PostgreSQL 17 container with pgvector. Data persists to `helix_pgdata` volume.
- **`helix_redis`**: Internal task queue and pub-sub.
- **`helix_minio`**: Internal S3-compatible object storage. Exposes port 9000 (API) and 9001 (Console).

### Health Checks
Docker Compose is configured with strict health checks. The backend will not start accepting traffic until `helix_db` and `helix_minio` return healthy ping statuses.

### Troubleshooting
- **Database Connection Errors:** Verify `POSTGRES_USER` and `POSTGRES_PASSWORD` match exactly in the `DATABASE_URL`.
- **Inference Errors:** Ensure the host has outbound internet access to reach the Fireworks AI API endpoints.
- **MinIO Upload Failures:** Ensure `MINIO_SECURE=false` if running without SSL locally.
