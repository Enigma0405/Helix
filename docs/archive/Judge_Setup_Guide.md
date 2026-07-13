# Judge Setup Guide — Project Helix EvidenceOps Platform

> **Goal:** Zero to running demo in under 5 minutes.
> **Version:** RC2 | **Last Updated:** 2026-07-08

---

## Prerequisites

Before starting, verify you have:

| Requirement | Minimum Version | Check Command |
|---|---|---|
| **Docker Desktop** | 4.x with Compose v2 | `docker compose version` |
| **Git** | Any recent version | `git --version` |
| **RAM** | 8 GB available | Check Docker Desktop → Resources |
| **Disk** | 5 GB free | — |
| **Ports free** | 80, 9000, 9001 | — |

> **Windows users:** Ensure Docker Desktop is running with WSL 2 backend enabled.
> **Mac M1/M2:** Works natively — all images have multi-arch support.
> **Linux:** Run `docker compose` (not `docker-compose`; Compose v2 required).

---

## Step 1: Get the Code

```bash
git clone https://github.com/your-org/project-helix.git
cd "project-helix"
```

Or if you have the ZIP archive:
```bash
unzip project-helix-rc2.zip
cd "Project Helix"
```

---

## Step 2: Configure Environment

```bash
cp .env.example .env
```

**Required change** (one line only):
```bash
# Open .env and set a JWT secret key.
# Generate one with:
python -c "import secrets; print(secrets.token_hex(32))"

# Then paste the output as the value of JWT_SECRET_KEY in .env:
JWT_SECRET_KEY=<your_generated_key_here>
```

All other defaults work for a local demo. The system runs in `INFERENCE_PROVIDER=mock` mode by default —
no external API keys required.

**Optional: Enable AMD/Fireworks AI (live LLM responses):**
```bash
# Add to .env:
INFERENCE_PROVIDER=fireworks
FIREWORKS_API_KEY=<your_fireworks_api_key>
FIREWORKS_MODEL=accounts/fireworks/models/gemma-4-31b-it
```

---

## Step 3: Build and Start All Services

```bash
docker compose up -d --build
```

**What to expect:**
- First run: Docker pulls 6 images (~2–3 GB total). This takes 3–5 minutes on a fast connection.
- Subsequent runs: Images cached; startup takes ~30–60 seconds.
- You will see build logs for the backend (Python packages) and frontend (npm build).
- The `-d` flag starts everything in the background.

**What is being built:**
```
helix_backend   ← Python 3.11, FastAPI, ML dependencies (~800 MB image)
helix_frontend  ← Node 20 npm build → static files served by nginx
helix_nginx     ← nginx:alpine image (pulled, not built)
helix_db        ← pgvector/pgvector:pg17 (pulled)
helix_redis     ← redis:7-alpine (pulled)
helix_minio     ← quay.io/minio/minio (pulled)
```

---

## Step 4: Verify All Services Are Healthy

```bash
docker compose ps
```

**Expected output (all services showing `healthy` or `running`):**

```
NAME             IMAGE                           STATUS                    PORTS
helix_backend    project-helix-backend           Up 45 seconds             8000/tcp
helix_db         pgvector/pgvector:pg17          Up 46 seconds (healthy)   5432/tcp
helix_frontend   project-helix-frontend          Up 45 seconds             3000/tcp
helix_minio      quay.io/minio/minio:latest      Up 46 seconds (healthy)   0.0.0.0:9000->9000/tcp, 0.0.0.0:9001->9001/tcp
helix_nginx      nginx:alpine                    Up 44 seconds             0.0.0.0:80->80/tcp
helix_redis      redis:7-alpine                  Up 46 seconds (healthy)   6379/tcp
```

If any service shows `Restarting` or `Exit`, see the [Troubleshooting](#troubleshooting) section.

**Quick health check:**
```bash
curl http://localhost/api/health
# Expected: {"status": "ok", "version": "1.0.0-rc2", ...}
```

---

## Step 5: Initialize the Database and Storage

Run these two setup scripts (one-time, takes ~10 seconds):

```bash
# Step 5a: Create MinIO storage buckets
pip install minio --quiet
python scripts/create_buckets.py

# Step 5b: Seed the database with demo data
pip install psycopg[async] passlib[bcrypt] httpx --quiet
python scripts/seed.py
```

**Expected output from seed.py:**
```
✅ Created organization: Apex Precision Manufacturing
✅ Created admin user: admin@helix.ai
✅ Created analyst user: demo@helix.ai
✅ Created 3 investigations
✅ Created sample CAPA plans
✅ Database seeded successfully
```

---

## Step 6: Open the Demo

Open your browser to: **http://localhost**

**Login credentials:**

| Role | Email | Password | What they can do |
|---|---|---|---|
| **Demo Analyst** | `demo@helix.ai` | `helixdemo2024` | Upload evidence, run AI analysis, view hypotheses |
| **Admin** | `admin@helix.ai` | `helixadmin2024` | Everything + approve CAPAs, manage users |

**Swagger API Documentation:** http://localhost/api/docs

**MinIO Console (object storage):** http://localhost:9001
- Username: `minioadmin` | Password: `change_me_in_production`

---

## Step 7: Run the Verification Suite (Optional but Recommended)

```bash
python scripts/health_check.py
```

**Expected output:**
```
✅ Nginx:      http://localhost        → 200 OK
✅ API Health: http://localhost/api/health → {"status": "ok"}
✅ API Docs:   http://localhost/api/docs   → 200 OK
✅ Auth:       POST /api/auth/login        → 200 OK
✅ MinIO:      http://localhost:9001       → 200 OK
✅ Database:   Connection verified
✅ Redis:      PONG received

All services operational. Helix is ready for demo.
```

---

## Demo Walkthrough (5 Minutes)

Once the system is running and seeded:

1. **Log in** as `demo@helix.ai` / `helixdemo2024`
2. **Navigate** to Investigations → click on "Batch #2847 Contamination Event"
3. **View Evidence** tab — see the uploaded SOP and batch records
4. **Click Analyze** — watch AI hypothesis generation (mock mode: instant; Fireworks: ~3 seconds)
5. **View Hypotheses** — see ranked root causes with confidence scores
6. **Click a Hypothesis** — expand citations, see exact source document passages
7. **Navigate to CAPA** tab — see AI-generated corrective + preventive actions
8. **Log in as admin** and **Approve** the CAPA — triggers knowledge capture
9. **View Evaluation** panel — see grounding score, citation precision, hallucination rate

---

## Troubleshooting

### Issue: Backend keeps restarting

```bash
docker compose logs backend --tail=50
```

**Common causes:**
- `DATABASE_URL` not reachable → wait 15 more seconds for PostgreSQL to be healthy
- `JWT_SECRET_KEY` is still the placeholder value → generate and set a real key
- Port 5432 already in use on host → not an issue (DB has no host port binding)

### Issue: `docker compose ps` shows helix_db as `starting` after 60 seconds

```bash
docker compose logs db --tail=20
# Look for: "database system is ready to accept connections"
```

If PostgreSQL never becomes healthy, check that port 5432 is not already used by a local PostgreSQL
installation. The database has no host port exposure by design — this should not conflict.

### Issue: Frontend shows blank page or "Cannot connect to API"

```bash
# Check nginx is running:
curl -I http://localhost
# Should return: HTTP/1.1 200 OK

# Check API is responding:
curl http://localhost/api/health
```

If Nginx is up but API returns 502, the backend may still be starting (the ML model loads on startup).
Wait 30 seconds and retry.

### Issue: seed.py fails with "Connection refused"

The database may not have finished initializing. Wait for `docker compose ps` to show `helix_db (healthy)`,
then retry `python scripts/seed.py`.

### Issue: create_buckets.py fails with "Connection error to MinIO"

```bash
# Check MinIO is healthy:
curl http://localhost:9000/minio/health/live
# Should return: 200 OK
```

If MinIO is not healthy, check `docker compose logs minio`.

### Issue: Port 80 already in use

```bash
# Find what is using port 80:
netstat -ano | findstr :80    # Windows
lsof -i :80                   # Mac/Linux

# Stop the conflicting service, then:
docker compose up -d
```

### Nuclear Reset (start completely fresh)

```bash
docker compose down -v      # Stops containers AND removes volumes
docker compose up -d --build
python scripts/create_buckets.py
python scripts/seed.py
```

---

## Verification: What Passing Looks Like

| Check | Command | Expected |
|---|---|---|
| All containers running | `docker compose ps` | 6 services, all Up |
| Health endpoint | `curl http://localhost/api/health` | `{"status": "ok"}` |
| Login works | Visit http://localhost, log in | Dashboard loads |
| Investigation list | Click Investigations | Shows pre-seeded cases |
| AI Analysis | Click Analyze on any investigation | Hypotheses appear |
| Citations | Click a hypothesis | Citations with source text shown |
| CAPA | Click CAPA tab | AI-generated action plan visible |

If all checks pass: **the system is fully operational and ready for demo.**

---

## Resource Usage (Approximate)

| Mode | CPU Idle | CPU Peak (analysis) | RAM |
|---|---|---|---|
| All services started | ~5% | ~30% (mock mode) | ~2.5 GB |
| With Fireworks (live AI) | ~5% | ~15% (API call, not local compute) | ~2.5 GB |
| Building from scratch | ~80% | ~80% | ~3 GB |

---

*For questions: see `docs/Developer_Guide.md` for deeper technical context.*
*For demo scripting: see `docs/Demo_Script_5min.md`.*
