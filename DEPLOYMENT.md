# Helix Deployment Guide

Helix is designed to be easily deployable in both local development environments and scalable cloud infrastructure.

## Local Deployment (Docker Compose)

The easiest way to run Helix is using the provided `docker-compose.yml` file. This spins up the entire stack locally.

1. Ensure Docker Desktop is installed and running.
2. Clone the repository.
3. Copy `.env.example` to `.env` and add your `FIREWORKS_API_KEY`.
4. Run:
   ```bash
   docker-compose up -d --build
   ```
5. Access the app at `http://localhost:80`.

## Cloud Deployment Strategy (Enterprise)

For production deployments, we recommend a decoupled, scalable architecture.

### 1. Database (PostgreSQL + pgvector)
- **Recommended Provider:** Neon or AWS RDS.
- **Why:** Neon provides serverless PostgreSQL with native `pgvector` support, allowing database compute to scale to zero when not in use, reducing costs for early-stage startups.

### 2. Frontend (Vite/React)
- **Recommended Provider:** Vercel or AWS Amplify.
- **Why:** Vercel offers zero-config deployments for Vite applications, global edge caching, and seamless CI/CD integration with GitHub.

### 3. Backend (FastAPI)
- **Recommended Provider:** Render or AWS ECS.
- **Why:** Render provides simple Docker container hosting. Since our FastAPI backend is stateless (state is managed by Postgres and Redis), it can scale horizontally with ease.

### 4. Storage & Queue (MinIO / Redis)
- **Storage:** AWS S3 (replacing local MinIO).
- **Queue:** Upstash (Serverless Redis) or AWS ElastiCache.

## Environment Variables

To deploy to production, the following critical environment variables must be configured in your hosting providers:

```env
# API Keys
FIREWORKS_API_KEY=your_key_here

# Database
DATABASE_URL=postgresql+psycopg2://user:password@host:5432/dbname

# Storage
MINIO_ENDPOINT=s3.amazonaws.com
MINIO_ACCESS_KEY=your_aws_access_key
MINIO_SECRET_KEY=your_aws_secret_key
MINIO_SECURE=true

# AI Provider Toggle (mock | fireworks)
INFERENCE_PROVIDER=fireworks
```
