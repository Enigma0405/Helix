# Helix Tech Stack

Our technology choices prioritize deterministic data handling, rapid development, and enterprise scalability.

## Frontend
* **React 18:** Component-based UI rendering. Chosen for its ecosystem and stability.
* **Vite:** Build tool. Chosen for instant server start and lightning-fast HMR.
* **Tailwind CSS:** Utility-first styling. Chosen for rapid, consistent, design-system-driven UI development.
* **React Query (@tanstack/react-query):** Server-state management. Chosen for robust caching, refetching, and synchronization of investigation data.
* **Framer Motion:** Animation library. Chosen to provide the micro-interactions that make the app feel alive and premium.
* **Lucide React:** Iconography. Chosen for clean, consistent, enterprise-grade icons.

## Backend
* **Python 3.10+:** Core backend language. Chosen for its unparalleled ecosystem in AI, data processing, and scripting.
* **FastAPI:** Web framework. Chosen for extreme performance and native Pydantic validation.
* **Pydantic:** Data validation. Chosen to enforce strict schema boundaries between the AI output and our deterministic system.
* **SQLAlchemy:** ORM. Chosen for robust, enterprise-grade SQL management.

## AI & Data
* **Fireworks AI:** Inference Provider. Chosen for industry-leading speed and latency.
* **Gemma-4-31b-it:** Foundational LLM. Chosen for high reasoning capability and native optimization on AMD hardware.
* **Nomic Embeddings (nomic-embed-text-v1.5):** Vector generation. Chosen for excellent semantic retrieval performance.
* **pgvector:** PostgreSQL extension. Chosen to keep our relational data and vector data in a single, ACID-compliant database.

## Infrastructure & Storage
* **PostgreSQL 17:** Primary Database. Chosen for reliability and ACID compliance.
* **Redis:** In-memory store. Chosen for task queueing and high-speed caching.
* **MinIO:** Object Storage. Chosen for S3-compatible, self-hosted file management (Evidence dropzone).

## Deployment & DevOps
* **Docker & Docker Compose:** Containerization. Chosen to guarantee environment parity and single-command local spin-up.
* **Nginx:** Reverse Proxy. Chosen to route traffic seamlessly between the Vite frontend and FastAPI backend.

## Developer Tools
* **TypeScript:** Static typing. Chosen to catch errors at compile-time and improve DX.
* **ESLint & Prettier:** Code quality. Chosen to maintain strict formatting standards.
