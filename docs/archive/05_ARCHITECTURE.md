# Helix System Architecture

This document provides a comprehensive technical overview of the Helix EvidenceOps platform, detailing the system architecture, knowledge flow, operational pipeline, and deployment strategies.

## System Architecture

Helix employs a decoupled, microservices-oriented architecture to ensure separation of concerns, scalability, and security.

```mermaid
graph TD
    subgraph Client Layer
        UI[React / Vite SPA]
    end

    subgraph API Gateway & Routing
        API[FastAPI Backend]
        Nginx[Nginx Reverse Proxy]
    end
    
    subgraph Core Services
        Auth[Authentication & RBAC]
        IE[Investigation Engine]
        CE[CAPA Engine]
        KM[Knowledge Manager]
    end
    
    subgraph AI Runtime Layer
        Context[Context Builder]
        Vector[Vector Retrieval]
        RAG[Multi-Step RAG Agent]
    end
    
    subgraph Infrastructure
        DB[(PostgreSQL + pgvector)]
        Storage[(MinIO Object Storage)]
        Redis[(Redis Task Queue)]
    end
    
    subgraph External Inference
        FW[Fireworks AI API]
        AMD[AMD Instinct GPUs]
    end

    UI --> Nginx
    Nginx --> API
    API --> Auth
    API --> IE
    API --> CE
    API --> KM
    
    IE --> Context
    CE --> Context
    KM --> Vector
    
    Context --> DB
    Vector --> DB
    Context --> RAG
    
    RAG --> FW
    FW --> AMD
    
    API --> Storage
    API --> Redis
```

## Knowledge Flow (Organization Memory)

The backbone of Helix is the **Organization Memory**—a deterministic knowledge graph derived from the enterprise's canonical documents.

```mermaid
sequenceDiagram
    participant User as QA / Admin
    participant API as FastAPI
    participant MinIO as Document Storage
    participant Vector as pgvector (DB)
    
    User->>API: Upload SOP / Batch Record
    API->>MinIO: Store Raw Document
    API->>API: Extract text & chunk
    API->>API: Generate Embeddings
    API->>Vector: Store vectors & metadata
    Vector-->>API: Acknowledge
    API-->>User: Document fully indexed
```

## Operational Pipeline

When an operational event occurs, Helix executes the EvidenceOps pipeline.

```mermaid
flowchart TD
    E1[Incoming LIMS/MES Event] --> T1{Safety Threshold Check}
    T1 -- Pass --> S1[Log as Routine]
    T1 -- Fail --> S2[Generate Operational Signal]
    
    S2 --> I1[Auto-Open Investigation]
    I1 --> R1[Retrieve Context from Org Memory]
    R1 --> A1[AI Cross-Verification]
    A1 --> C1[Assess Confidence & Gaps]
    C1 --> C2[Draft CAPA]
    C2 --> H1[Human Review & Approval]
    H1 --> E2[Archive to Org Memory]
```

## AI Inference Pipeline

Helix restricts AI inference strictly to deterministic reasoning using RAG (Retrieval-Augmented Generation). 

1. **Context Boundary:** The AI receives the user query + highly relevant chunks from `pgvector`.
2. **Instruction Enforcement:** The prompt strictly forbids inventing facts. It must cite exact chunks.
3. **Structured Extraction:** Using Fireworks AI, we enforce `json_schema` outputs to ensure the AI returns programmatic JSON objects representing the Assessment and CAPA, not conversational text.

## Database Relationships

```mermaid
erDiagram
    ORGANIZATION ||--o{ USER : contains
    ORGANIZATION ||--o{ INVESTIGATION : tracks
    INVESTIGATION ||--o{ EVIDENCE : collects
    INVESTIGATION ||--o{ CAPA : generates
    INVESTIGATION ||--o{ AUDIT_LOG : audits
    DOCUMENT ||--o{ CHUNK : splits_into
    
    INVESTIGATION {
        uuid id
        string title
        string status
        string severity
    }
    EVIDENCE {
        uuid id
        string original_filename
        string status
    }
    CAPA {
        uuid id
        string content
        string status
    }
```
