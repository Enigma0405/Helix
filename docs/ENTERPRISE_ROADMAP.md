# Enterprise Architecture Roadmap

Helix is designed to scale from a single-facility pilot to a global enterprise deployment. To ensure transparency, we explicitly separate the features implemented in the current MVP from our future production vision.

## MVP Today (Implemented)

The current iteration of Helix successfully demonstrates the core EvidenceOps loop:

- **Canonical Organization Memory:** PostgreSQL database seeding and querying for Equipment, SOPs, and Relationships.
- **EvidenceOps Runtime Flow:** API integration covering Evidence Upload, Cross-Verification, and CAPA Generation.
- **AI Integration:** Seamless integration with Fireworks AI for structured JSON extraction and reasoning.
- **Modern UI:** React/Vite frontend featuring the Intelligent Tracing engine and dynamic context drawers.
- **Single-Tenant Structure:** The application operates within the context of a single organizational tenant ("Aetheris BioPharma").

## Future Vision (Planned for Production)

As Helix scales toward enterprise readiness, the following architectural enhancements are planned:

### 1. Multi-Tenant Isolation
- **Row-Level Security (RLS):** Implementation of PostgreSQL RLS via Neon to ensure strict cryptographic separation of data between different organizational tenants.
- **Tenant-Specific Knowledge Graphs:** Allowing different organizations (e.g., Aetheris vs. GlobalPharma) to maintain entirely distinct, private Organization Memories.

### 2. CI/CD Pipeline
- **Automated Deployments:** Implementation of GitHub Actions for automated testing, linting, and zero-downtime deployments to staging and production environments.
- **Infrastructure as Code (IaC):** Utilizing Terraform to manage the deployment of Neon databases, Vercel/Render hosting, and MinIO storage buckets.

### 3. Scalability & Cost Efficiency
- **Edge Caching:** Implementing Redis for high-speed caching of frequent Organization Memory queries (e.g., SOP constraints) to reduce database load.
- **Asynchronous Processing:** Moving heavy inference tasks (like analyzing 100-page batch records) to a message queue (e.g., Celery/RabbitMQ) to prevent API timeouts.
- **Inference Optimization:** Dynamic model routing based on task complexity to optimize cost (e.g., using smaller, faster models for simple classification, and MI300X-backed large models for complex reasoning).

### 4. Advanced Regulatory Features
- **OAuth & SSO Integration:** Enterprise-grade authentication via Okta or Azure AD.
- **Part 11 Compliant Electronic Signatures:** Formal 2FA/biometric gating prior to CAPA approval.
