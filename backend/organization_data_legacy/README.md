# Enterprise Organization Data

This directory (`organization_data`) serves as the single canonical location for runtime organization data in Helix. All customer and enterprise data lives here, entirely separated from the application source code in `backend/src`.

**CRITICAL RULES:**
- `backend/src` contains ONLY application code.
- `organization_data` contains ONLY customer runtime data.
- The `docs` directory at the project root remains solely for engineering/project documentation and must never be ingested or used directly as runtime organization data.

## Directory Structure Overview

### 1. `organization_seed`
Contains stable organization reference knowledge that is meant to be ingested into Organization Memory:
- **SOPs**: Standard Operating Procedures
- **Policies**: Corporate and facility-level policies
- **Equipment**: Registers and specifications for machinery/tools
- **Employees**: Reference data on personnel
- **Suppliers**: Reference data on vendors/suppliers
- **Departments**: Organizational structure
- **Processes**: Documented manufacturing and business processes

### 2. `historical_memory`
Contains historical closed records serving as long-term organizational knowledge:
- **Closed historical investigations**
- **CAPAs** (Corrective and Preventive Actions)
- **Batch records**
- **Calibration history**
- **Audit reports**
- **Deviations**

### 3. `demo_evidence`
Contains raw event data intended for real-time or simulated processing:
- **Incoming evidence** uploaded during active investigations
- *Note:* These files are never pre-ingested into Organization Memory; they flow through the runtime event engine.

### 4. `manifests`
Files generated dynamically by the system during ingestion:
- **Import manifests**
- **Validation reports**
- **Checksums**
