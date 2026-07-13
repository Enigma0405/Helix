# Release Notes

## Helix v1.0 (Hackathon Final Release)
**Release Date:** July 2026

We are thrilled to announce the v1.0 release of Helix, our AI-native Enterprise Operational Intelligence platform built on the EvidenceOps architecture.

### Core Features Included
- **EvidenceOps Pipeline:** Full end-to-end flow from Event Ingestion -> Verification -> Investigation -> CAPA.
- **Organization Memory:** Deployed `pgvector` knowledge graph integration allowing deterministic AI reasoning against canonical SOPs and equipment records.
- **Mission Control Dashboard:** A real-time, interactive React SPA for monitoring operational signals.
- **Investigation Engine:** Automated assessment of root causes with confidence scoring and evidence gaps identification.
- **Traceability Ledger:** Visual graph modal proving the immutable links between personnel, equipment, rules, and operational events.
- **AMD Hardware Acceleration:** Integration with Fireworks AI (powered by AMD Instinct GPUs) for ultra-low latency structured JSON inference.

### Architecture Improvements
- Standardized the FastAPI backend architecture.
- Containerized the entire stack using Docker Compose for 1-click local deployments.
- Implemented strict RBAC and multi-tenant `org_id` isolation across all database queries.

### Known Limitations (MVP Demo)
- Direct API integration with live MES/LIMS systems (SAP, Siemens) is pending; events are currently simulated or manually ingested.
- The Hypothesis Acceptance check is bypassed in the backend to ensure a seamless 5-minute presentation flow.
- Audit logs are currently stored in standard PostgreSQL tables; cryptographic signing is planned for v2.0.

### Getting Started
Please see the `01_README.md` and `07_DEPLOYMENT.md` files for instructions on running Helix v1.0 locally or deploying to the cloud.
