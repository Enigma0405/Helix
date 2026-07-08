# FounderOS Tech Overview — Project Helix

> **Author:** Chief Technology Officer, Project Helix  
> **Document Status:** Final (RC2 Release)  
> **Target Audience:** Technical Advisory Board, Lead Architects, Partner Engineering  
> **Category:** Technical Strategy & Design Patterns  

---

## 1. Architectural Decisions & Rationale

Helix is structured as a **modular monolith** with clear domain boundaries, designed for rapid deployment and simple extraction into microservices if scaling requires it.

```
       [ Client Browser (React SPA) ]
                     │ (HTTPS / SSE / WS)
                     ▼
         [ Nginx Reverse Proxy ]
                     │ (Port 80 routing)
                     ▼
        [ FastAPI Backend Monolith ]
         ├── Core Services (Auth, DB, S3)
         ├── Domain Packages (Evidence, Assets, Knowledge, Export)
         └── AI Runtime Engine
              ├── Primitives (Adapter, Grounding, Policy)
              └── Workflows (Hypothesis, CAPA, Capture)
                     │
         ┌───────────┴───────────┐
         ▼                       ▼
    [ pgvector / DB ]     [ Redis / Cache ]
```

### Core Architecture Components:
*   **Database (PostgreSQL + pgvector)**: Chosen to store relational operational entities alongside high-dimensional embedding vectors within a single transactional engine.
*   **Object Storage (MinIO / S3)**: Serves as the primary raw data store for uploaded quality evidence. All files are referenced inside PostgreSQL by secure content hashes.
*   **Reverse Proxy (Nginx)**: Manages CORS, routes, SSL termination, and handles extended socket read/write timeouts (up to 300 seconds) required for heavy batch AI tasks.

---

## 2. Pluggable AI Runtime & Hardware Independence

The cornerstone of the Helix tech stack is the **Inference Adapter Pattern**. By wrapping all LLM API invocations inside a standard interface, we decouple application workflows from provider SDKs.

```
                         [ AI Runtime Workflows ]
                                    │
                       [ InferenceAdapter Protocol ]
                                    │
         ┌──────────────────┬───────┴──────────┬─────────────────┐
         ▼                  ▼                  ▼                 ▼
   [ Fireworks ]        [ OpenAI ]          [ Local ]         [ Mock ]
   (Gemma 4 IT)        (GPT-4o-mini)       (Ollama)          (CI/Testing)
         │
         ▼
   [ AMD MI300X ]
```

### Implementation Rationale:
1.  **Eliminating Vendor Lock-In**: Swapping providers from proprietary APIs to open-weight models on specialized hardware (e.g., AMD Instinct MI300X running Gemma 4 via Fireworks AI) requires modifying a single environment variable: `INFERENCE_PROVIDER=fireworks`.
2.  **DevOps & Testing Simplicity**: Local developers and CI pipelines execute tests instantly using `INFERENCE_PROVIDER=mock`, completely bypassing external networking dependencies, cost accumulation, and rate limits.
3.  **Local/Air-Gapped Operation**: Industrial and military deployments can swap to `INFERENCE_PROVIDER=local` pointing to an on-premise Ollama service running on private servers.

---

## 3. EvidenceOps vs. Simple RAG Chatbots

Most AI products are simple chat wrappers. Helix is built as an **EvidenceOps Platform**, which fundamentally shifts the paradigm:

| Feature | Standard RAG Chatbot | Helix EvidenceOps Platform |
|---|---|---|
| **Interactivity** | Conversational chat interface | Structured business workflow screens |
| **Output Type** | Markdown paragraphs | Typed Database Schemas (Hypotheses, Tasks, CAPAs) |
| **Auditing** | Non-existent or manual logs | 21 CFR Part 11 compliant audit trails |
| **Verification** | Generative guesswork | Real-time `citation_precision` & `grounding_score` tracking |
| **Organizational Memory** | Session-based history | Automated extraction and indexing of lessons learned |

---

## 4. Key Engineering Lessons Learned

1.  **Design for SQLite Dialect Compatibility Early**: Building test code to use SQLite while production runs on Postgres/pgvector requires early abstraction of vector similarity queries. Writing a compiled fallback SQL decorator and Python dot-product loops proved that robust testing layers pay off.
2.  **Isolate sentence-transformers Embeddings**: Sentence-transformers running on local CPUs do not safely share memory when forked by multiple uvicorn server workers. Locking the production container to `workers=1` ensures thread safety, while scaling is achieved by routing embeddings to external vector APIs (`EMBEDDING_PROVIDER=fireworks`).
3.  **Human-in-the-Loop is the Only Way**: In compliance environments, autonomous AI agents are a liability. By focusing the product UX around **AI suggestion + human confirmation**, we bypass FDA software-as-a-medical-device (SAMD) validation barriers, accelerating enterprise adoption.
