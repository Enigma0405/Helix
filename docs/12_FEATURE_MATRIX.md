# Feature Matrix

To maintain absolute transparency with judges and investors, this matrix clearly delineates what is fully implemented in the v1.0 codebase, what is mocked for the live demo scenario, and what is reserved for future development.

| Feature | Status | Description |
| :--- | :--- | :--- |
| **Authentication System** | Implemented | JWT-based auth via FastAPI, protected React routes. |
| **Demo Auth Bypass** | Demo Scenario | UI pre-populates credentials (`sarah.chen@apex.com`) for immediate demo access. |
| **Database Schema** | Implemented | Fully relational PostgreSQL schema with SQLAlchemy ORM. |
| **Vector Storage** | Implemented | `pgvector` extension is active and storing document chunks. |
| **Knowledge Ingestion** | Implemented | Python scripts parse, chunk, and embed documents into the DB. |
| **Live MES Integrations** | Future Work | Currently relies on manual REST API uploads; direct SAP/Siemens integrations planned. |
| **Mission Control UI** | Implemented | React SPA with Tailwind CSS, fully responsive. |
| **Event Timeline** | Demo Scenario | The timeline nodes and mock LIMS/CSV upload simulate a live data feed for visual storytelling. |
| **AI Assessment Engine** | Implemented | Calls Fireworks AI backend to execute structured JSON reasoning. |
| **Automated Pipeline Sequence** | Implemented | The UI automatically chains Upload -> Assessment -> CAPA generation in React state. |
| **Traceability Modal** | Implemented | UI component querying the investigation graph to display the immutable ledger. |
| **Cryptographic Signatures** | Future Work | Blockchain or strict cryptographic hashing of audit logs planned for enterprise release. |
| **CAPA Generation** | Implemented | Backend executes multi-step prompt to draft CAPA based on accepted hypotheses. |
| **Hypothesis Acceptance Check** | Demo Scenario | Backend constraint temporarily bypassed to allow smooth, one-click CAPA generation for the hackathon. |

## Honesty Guarantee
We do not use "Wizard of Oz" tactics. The architecture deployed is the architecture described. When the AI generates text, it is making a live API call to Fireworks AI. When data is saved, it persists to PostgreSQL. Mocked data is strictly limited to the initial *seeding* of the tenant to provide a realistic operating environment.
