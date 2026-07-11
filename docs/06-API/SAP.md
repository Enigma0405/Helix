# SAP ERP Data Contract

## Purpose
SAP is the system of record for inventory, materials management, and product disposition. Helix queries SAP to determine the exact batch numbers of raw materials consumed during a deviation, and to automatically place affected batches on Quality Hold (Restricted Status).

## Core Endpoints used by Helix

### `GET /api/v1/sap/materials/{batchId}/genealogy`
Returns the backward genealogy (raw materials consumed) and forward genealogy (where this batch went).
```json
{
  "batch_id": "B-2026-089",
  "material_description": "Monoclonal Antibody X",
  "components_consumed": [
    {
      "material_id": "MAT-WFI-001",
      "lot": "LOT-9923"
    },
    {
      "material_id": "MAT-FIL-022",
      "lot": "LOT-4458"
    }
  ]
}
```

### `POST /api/v1/sap/inventory/status`
Helix's Root Cause Agent uses this endpoint (via human-in-the-loop approval) to change the inventory status to "Quarantine" if a critical deviation is detected.
```json
{
  "batch_id": "B-2026-089",
  "new_status": "RESTRICTED",
  "reason_code": "INV-2026-011",
  "requested_by": "Helix_System_Account"
}
```
