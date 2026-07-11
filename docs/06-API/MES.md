# MES (Manufacturing Execution System) Data Contract

## Purpose
The MES (Manufacturing Execution System) is the master record for electronic batch execution. Helix interfaces with MES to pull live batch context, timestamps, and operator interactions during an investigation.

## Core Endpoints used by Helix

### `GET /api/v1/mes/batches/{batchId}`
Retrieves the current status and electronic batch record (EBR) summary for a given batch.
```json
{
  "batch_id": "B-2026-089",
  "product_id": "PROD-MAB-01",
  "status": "In Progress",
  "current_recipe_step": "Sterile Filtration",
  "active_equipment": ["EQ-FIL-008"],
  "logged_operators": ["EMP-3188"]
}
```

### `GET /api/v1/mes/batches/{batchId}/audit-trail`
Retrieves all ALCOA+ compliant operator actions. Helix uses this to construct timelines.
```json
{
  "events": [
    {
      "timestamp": "2026-06-15T15:15:00Z",
      "action": "Start_Test",
      "parameter": "Integrity Test",
      "operator_id": "EMP-3188",
      "terminal_id": "HMI-FIL-01"
    }
  ]
}
```

## How Helix Uses MES
If an investigation involves a missed step or a timing issue (e.g., wetting a filter for 2 minutes instead of 5), Helix parses the `/audit-trail` endpoint to perfectly reconstruct the operator's actions and compare them against `SOP-STER-014`.
