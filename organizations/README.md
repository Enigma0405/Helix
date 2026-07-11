# Enterprise Organizations Data Repository

This directory serves as the **single, canonical location** for enterprise datasets to support multiple organizations (tenants) without duplicate sources of truth. 

Each subdirectory represents a distinct customer/organization (e.g., `apex_precision`). All data required to run Helix for that organization is completely contained within its respective folder.

## Adding a New Organization
To onboard a new organization, create a new folder (e.g., `company_a/`) mimicking the structure of `apex_precision/`, and include a valid `organization.json`. **No backend code changes are required** to support a new organization.

## Folder Boundaries

- **`organization_seed/`**: Stable organizational reference knowledge (SOPs, Policies, Equipment, Products, Departments).
- **`historical_memory/`**: Closed historical operational records (Investigations, CAPAs, Audit Reports).
- **`demo_evidence/`**: Files intended for manual upload during demonstrations. These are NOT pre-ingested.
- **`manifests/`**: Output manifests and summaries detailing the state of the organization's knowledge.

> **Note**: `docs/` is engineering documentation only. Nothing inside `docs/` should ever be treated as runtime organization knowledge.
