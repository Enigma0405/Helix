# Knowledge Relationships (The Helix Graph)

This document defines the ontology and relationships between entities within the Helix Enterprise Knowledge Layer. 
Even though the data currently resides in JSON files, Helix processes this data as a knowledge graph to perform EvidenceOps.

## Core Entities

1. **Investigation** (`INV-*`): A recorded anomaly or deviation event.
2. **Batch** (`B-*`): A specific production run of a product.
3. **Equipment** (`EQ-*`): A physical asset used in production.
4. **Operator** (`EMP-*`): An employee involved in manufacturing or quality.
5. **SOP** (`SOP-*`): Standard Operating Procedure detailing a required process.
6. **Regulation** (`REG-*`): A compliance requirement (e.g., FDA 21 CFR Part 211).
7. **CAPA** (`CAPA-*`): Corrective and Preventive Action taken to resolve an investigation.
8. **Calibration** (`CAL-*`): A record of equipment calibration.
9. **Facility/Department**: The physical and organizational location.

## Relational Edges

- `Investigation` **AFFECTS** `Batch`
- `Investigation` **INVOLVES** `Equipment`
- `Investigation` **REPORTED_BY** `Operator`
- `Investigation` **VIOLATES_POTENTIALLY** `Regulation`
- `Investigation` **RESOLVED_BY** `CAPA`
- `Batch` **PRODUCED_ON** `Equipment`
- `Batch` **PRODUCED_BY** `Operator`
- `Equipment` **LOCATED_IN** `Facility/Department`
- `Equipment` **REQUIRES** `Calibration`
- `Equipment` **GOVERNED_BY** `SOP`
- `Operator` **TRAINED_ON** `SOP`
- `CAPA` **UPDATES** `SOP`
- `CAPA` **RETRAINS** `Operator`

## Graph Traversal Example (Helix Reasoning)

When Helix ingests an investigation for a sterile filter failure:

1. **Starts at**: `Investigation (INV-2026-042)`
2. **Traverses to**: `Equipment (EQ-BIO-014)` (The filter housing)
3. **Traverses to**: `Calibration (CAL-2026-081)` (Checks if filter was properly calibrated)
4. **Traverses to**: `SOP (SOP-STER-014)` (Checks the procedure for filter integrity testing)
5. **Traverses to**: `Regulation (FDA 21 CFR Part 211.113)` (Checks regulatory requirement for sterile operations)
6. **Matches**: `Investigation (INV-2025-0032)` (Finds a historical case where EQ-BIO-014 had a similar failure)
7. **Recommends**: `CAPA (CAPA-2025-015)` (Proposes the same corrective action that succeeded previously)
