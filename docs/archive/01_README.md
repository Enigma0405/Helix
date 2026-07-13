# Helix v1.0

![Helix Hero](https://via.placeholder.com/1200x400?text=Helix+-+Evidence+Before+AI)

## Evidence before AI. Always.

Helix transforms organizational knowledge into evidence-backed operational intelligence for regulated industries. 

### The Problem
Organizations in highly regulated industries (Pharmaceuticals, Manufacturing, Aerospace) continuously generate operational events. Existing quality management systems act as passive databases—relying entirely on humans to manually search, correlate, and verify every anomaly against tens of thousands of dynamic procedures, manuals, and historical records. This leads to slow investigations, high compliance risks, and reactive quality cultures.

**Why Existing Systems Fail**
- Passive data storage requires manual correlation.
- Static keyword searches fail to grasp complex dependencies.
- Black-box AI tools violate regulatory requirements for traceability and explainability.

### The Solution: EvidenceOps
Helix introduces the **EvidenceOps** paradigm. We believe that **models observe, systems decide, and humans remain accountable**. 

Helix continuously observes incoming operational events, verifies them against a canonical graph of your organization's knowledge (Organization Memory), and surfaces deterministically verified intelligence. It never invents answers; it only correlates facts.

---

## Enterprise Workflow

```mermaid
flowchart TD
    EK[Enterprise Knowledge] -->|Baseline| IE(Incoming Operational Events)
    IE --> AI[AI Verification & Cross Validation]
    AI --> OS[Operational Signals]
    OS --> INV[Investigation Engine]
    INV --> EC[Evidence Correlation]
    EC --> AS[Assessment]
    AS --> CP[CAPA Generation]
    CP --> HA[Human Approval]
    HA --> HL[Historical Learning]
    HL -->|Loop Closed| EK
```

### Key Features
- **Organization Memory:** A dynamic, deterministic knowledge graph of SOPs, batch records, equipment specs, and historical CAPAs.
- **Continuous AI Verification:** Real-time ingestion and validation of operational events (LIMS, MES, SAP) against the Organization Memory.
- **Investigation Engine:** Automated correlation of incoming deviations against historical similarities and regulatory requirements.
- **Evidence-Backed CAPA Drafting:** AI-generated Corrective and Preventive Actions (CAPA) with 100% deterministic traceability back to source documents.
- **Immutable Audit Trails:** Full traceability of all AI inferences and actions.

---

## Architecture Overview

```mermaid
graph TD
    Client[Client UI - React/Vite] --> API[FastAPI Gateway]
    API --> Auth[Authentication]
    API --> Engine[Runtime Engine]
    
    Engine --> Context[Context Builder]
    Engine --> Workflows[AI Workflows]
    
    Context --> DB[(PostgreSQL + pgvector)]
    Context --> Graph[Organization Memory]
    
    Workflows --> FW[Fireworks AI Adapter]
    FW --> AMD[AMD Instinct GPUs]
```

### Technology Stack
- **Frontend:** React, TypeScript, Vite, Tailwind CSS, Zustand
- **Backend:** Python, FastAPI, SQLAlchemy, PostgreSQL, pgvector
- **AI Infrastructure:** Fireworks AI (Powered by AMD Instinct GPUs)
- **Deployment:** Docker, Vercel (Frontend), Render (Backend), Neon (Database)

### Hardware & AI Partnership
Helix is fundamentally accelerated by **AMD Instinct GPUs** running on **Fireworks AI**. The massive parallelization required for real-time vector search across enterprise knowledge and rapid structured JSON generation is powered by AMD hardware, ensuring the low-latency response times critical for live operational monitoring.

---

## Installation & Local Development

### Prerequisites
- Docker & Docker Compose
- Python 3.12+
- Node.js 20+
- Fireworks AI API Key

### Environment Variables
Create a `.env` file in the `backend/` directory:
```bash
DATABASE_URL=postgresql+psycopg://user:pass@localhost:5432/helix
FIREWORKS_API_KEY=your_api_key_here
```

### Docker Setup (Recommended)
```bash
docker-compose up --build
```
This spins up the database, backend, and frontend simultaneously.

### Manual Setup
**Backend:**
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn src.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## Demo Instructions

### Demo Tenant
**Aetheris BioPharma Private Limited**

### Credentials
- **Demo User:** demo@helix.ai
- **Password:** Password123

### Walkthrough
1. **Mission Control:** Observe the live incoming operational events on the Dashboard.
2. **Ingestion:** Upload an evidence document (e.g., LIMS Report) via the live operations pipeline.
3. **Observation:** Watch the AI cross-verify the document against Aetheris BioPharma's Organization Memory in real-time.
4. **Investigation:** Open the auto-generated Operational Signal to view the intelligent trace.
5. **CAPA:** Review the deterministically drafted CAPA and approve it to close the loop.

---

## Roadmap
- **v1.0 (Current):** EvidenceOps MVP, Organization Memory, CAPA Drafting.
- **v2.0:** Multi-Agent specialized workflows (e.g., Audit Prep Agent).
- **Enterprise:** On-premise deployment, ERP/MES deep integrations.

---

## License
Copyright (c) 2026 Helix Inc. All rights reserved.
