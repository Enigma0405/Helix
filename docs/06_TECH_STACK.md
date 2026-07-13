# Helix Technology Stack

Helix is built on a modern, enterprise-grade technology stack designed for scalability, security, and low-latency AI inference. This document details our choices and the tradeoffs involved.

## Frontend Layer

**Core:** React 18, TypeScript, Vite
**Styling:** Tailwind CSS
**State Management:** Zustand (Global Auth), React Query (Server State)
**Routing:** React Router DOM

**Why Selected:** 
React combined with Vite provides lightning-fast HMR and optimized production builds. TypeScript enforces strict type safety, which is critical when dealing with complex, nested JSON objects returned by our structured AI endpoints. React Query manages caching and stale-while-revalidate logic seamlessly.

**Tradeoffs:** 
Next.js was considered for SSR (Server-Side Rendering), but as a B2B Enterprise Dashboard hidden entirely behind authentication, SEO is irrelevant. A standard SPA (Single Page Application) deployed via Vite offers a simpler operational footprint.

## Backend Layer

**Core:** Python 3.12, FastAPI
**Validation:** Pydantic v2
**ORM:** SQLAlchemy (Async)

**Why Selected:** 
Python is the undisputed lingua franca of AI/ML. FastAPI provides exceptional asynchronous performance and automatically generates OpenAPI (Swagger) documentation natively. Pydantic v2 is incredibly fast and enforces strict schema validation for every incoming request and outgoing response.

**Tradeoffs:** 
Node.js/Express could unify the language stack (TypeScript everywhere), but the Python ecosystem's tooling for AI integration, chunking, and embedding generation is vastly superior.

## Database & Infrastructure

**Database:** PostgreSQL 17
**Vector Search:** pgvector
**Object Storage:** MinIO (S3 Compatible)
**Caching/Queue:** Redis

**Why Selected:** 
PostgreSQL is the industry standard for relational data. By utilizing the `pgvector` extension, we keep our relational metadata (Investigations, Users, CAPAs) and our vector embeddings (Document Chunks) in the exact same database. This avoids the "split-brain" synchronization nightmare that occurs when using standalone vector databases like Pinecone or Weaviate alongside a standard RDBMS.

MinIO provides an S3-compatible, self-hosted storage solution for highly sensitive enterprise evidence files that cannot be pushed to public cloud buckets without strict compliance controls.

## AI & Inference (The AMD Advantage)

**Provider:** Fireworks AI
**Hardware:** AMD Instinct GPUs
**Techniques:** Structured JSON Output, Zero-Shot RAG

**Why Selected:** 
In live operational environments, latency is unacceptable. When a deviation occurs on a manufacturing line, the system cannot wait 30 seconds for an LLM to generate a response. 
By utilizing **Fireworks AI** powered by **AMD Instinct GPUs**, we achieve ultra-low latency inference. The massive parallel compute of AMD GPUs allows us to execute multi-step RAG pipelines—retrieval, semantic matching, gap analysis, and structured JSON generation—in under two seconds. 

## Deployment & DevOps

**Frontend Hosting:** Vercel
**Backend Hosting:** Render (or Docker Swarm for on-premise)
**Containerization:** Docker & Docker Compose

**Why Selected:** 
Docker Compose ensures absolute parity between local development and production. Vercel provides seamless global edge delivery for the static SPA. Render provides easy container orchestration for the FastAPI backend, easily scaling based on CPU utilization.
