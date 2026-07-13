# Deployment Guide

Helix is designed to be deployed across a modern, decoupled infrastructure stack. 

## Infrastructure Flow

```text
Vercel (Frontend Hosting)
  ↓
Render (Backend API Hosting)
  ↓
Neon (Serverless PostgreSQL)
  ↓
Fireworks AI (LLM Inference)
  ↓
Docker (Local Development & Containerization)
```

## Required Environment Variables

To successfully run Helix, the following environment variables must be configured in your environment or `.env` file:

- `DATABASE_URL`: Connection string to your Neon PostgreSQL database.
- `FIREWORKS_API_KEY`: API key for accessing Fireworks AI inference endpoints.
- `MINIO_URL` / `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY`: Configuration for the object storage bucket (used for evidence).

## Deployment Order

When standing up the environment from scratch, follow this sequence:
1. **Database & Storage:** Provision the Neon PostgreSQL instance and the MinIO/S3 bucket.
2. **Backend (Render):** Deploy the FastAPI backend. Ensure it successfully connects to the database and runs any pending schema migrations.
3. **Inference Configuration:** Verify the `FIREWORKS_API_KEY` is injected into the backend environment.
4. **Frontend (Vercel):** Deploy the React frontend. Configure the `VITE_API_URL` to point to the Render backend URL.

## Health Checks

- **Backend:** Ping `GET /health` (if implemented) or load `http://<backend-url>/docs` to verify FastAPI is serving.
- **Database:** Ensure the `seed_canonical.py` script ran successfully and populated the database.
- **Frontend:** Load the Vercel URL and ensure the Mission Control dashboard fetches data without CORS errors.
