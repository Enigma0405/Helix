<div align="center">
  
# Helix
### Evidence before AI. Always.

**An EvidenceOps Platform built for highly regulated manufacturing.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Powered by AMD](https://img.shields.io/badge/Powered_by-AMD_Instinct_MI300X-black?logo=amd)](https://www.amd.com/)
[![Inference by Fireworks AI](https://img.shields.io/badge/Inference-Fireworks_AI-FF4500)](https://fireworks.ai/)

</div>

---

## The Problem
Biopharma manufacturing operates in an environment of zero tolerance for error. When a quality event occurs (a deviation, a sensor drift, an out-of-spec test), Quality Assurance (QA) teams spend weeks manually piecing together evidence from scattered silos—batch records, historian data, calibration logs, and standard operating procedures (SOPs). 

Traditional QMS (Quality Management Systems) are just static forms. AI chatbots are too risky; they hallucinate and cannot be audited.

## The Solution: EvidenceOps
**Helix introduces a new category: EvidenceOps.**

Helix does not start with AI. It starts with an **Organization Memory**—a deterministic, canonical graph of the facility's knowledge. 

When a deviation occurs, operators upload evidence. Helix maps that evidence directly to the Organization Memory, tracing exactly who was involved, which facility it occurred in, what equipment failed, and what SOP was violated. 

Only *after* the evidence is structured and mapped does Helix invoke the AI **Intelligence Layer** to generate an Evidence-Backed Assessment and draft a Corrective and Preventive Action (CAPA). 

Models observe. Systems decide. Humans remain accountable.

---

## ⚡ Powered by AMD & Fireworks AI

Helix demands instantaneous reasoning over thousands of dense manufacturing parameters. 
We achieved this using:
- **Fireworks AI Integration:** Our Intelligence Layer uses `FireworksAdapter` to handle high-throughput structured JSON extraction.
- **AMD Instinct™ MI300X:** Through Fireworks AI, Helix leverages the massive memory bandwidth of AMD Instinct MI300X accelerators to run `Gemma-4-31b-it` at blistering speeds, ensuring our QA operators get sub-second reasoning even when evaluating dense, multi-page batch records.

---

## Key Features

1. **Mission Control Dashboard:** A real-time unified queue of active signals, historical insights, and supplier intelligence.
2. **Deterministic Evidence Mapping:** Upload raw logs and let the platform trace them back to the exact equipment and personnel in the facility.
3. **Evidence-Backed Reasoning (RAG):** AI doesn't guess. It extracts facts, identifies gaps, and calculates a confidence score based strictly on the provided evidence.
4. **Strategic CAPA Workflow:** Auto-drafts a 3-step Corrective and Preventive Action (Containment, Systemic Prevention, Closure) ready for human verification.
5. **Organization Memory:** A PostgreSQL `pgvector` knowledge graph connecting SOPs, Equipment, Batches, and Personnel.

---

## Product Walkthrough

### 1. EvidenceOps Architecture
![Architecture](./docs/assets/architecture.png)

### 2. Mission Control
![Mission Control Dashboard](./docs/assets/dashboard.png)

### 3. Investigation Workspace (Evidence Mapping)
![Investigation Workspace](./docs/assets/investigation_blank.png)

### 4. Deterministic AI Reasoning & CAPA Generation
![AI Assessment](./docs/assets/investigation.png)

---

## Architecture Overview

Helix is divided into three core layers:

1. **Organization Memory:** The deterministic foundation (PostgreSQL + pgvector). Stores structured blueprints of the organization (Aetheris BioPharma).
2. **Knowledge Layer:** The chunking and retrieval engine. Uses `nomic-embed-text-v1.5` to embed documents into the vector store.
3. **Intelligence Layer:** The reasoning engine. Uses `FireworksAdapter` to invoke LLMs strictly for structured JSON synthesis based on retrieved context.

---

## Technology Stack

- **Frontend:** React, Vite, Tailwind CSS, React Query, Framer Motion
- **Backend:** Python, FastAPI, Pydantic, SQLAlchemy
- **Database:** PostgreSQL with `pgvector`
- **AI / Inference:** Fireworks AI, Nomic Embeddings, Gemma 4
- **Infrastructure:** Docker, Nginx, Redis, MinIO (S3)

---

## Local Development (Docker)

Helix is fully containerized and easy to run locally.

### Prerequisites
- Docker & Docker Compose
- A Fireworks AI API Key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/helix.git
   cd helix
   ```

2. **Configure Environment Variables**
   ```bash
   cp .env.example .env
   # Edit .env and add your FIREWORKS_API_KEY
   ```

3. **Start the Platform**
   ```bash
   docker-compose up -d --build
   ```

4. **Access the Application**
   - Frontend: `http://localhost:80`
   - Backend API Docs: `http://localhost:8000/docs`

---

## License

This project is licensed under the MIT License - see the LICENSE file for details.
