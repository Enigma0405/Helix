# LIMS (Laboratory Information Management System) Data Contract

## Purpose
LIMS stores all Quality Control (QC) analytical testing results. Helix queries LIMS to gather environmental monitoring data, bioburden results, and release testing data relevant to an investigation.

## Core Endpoints used by Helix

### `GET /api/v1/lims/results/batch/{batchId}`
Retrieves all completed and pending QC tests for a given batch.
```json
{
  "batch_id": "B-2026-089",
  "tests": [
    {
      "test_name": "Bioburden (Pre-filtration)",
      "result": "0 CFU/10mL",
      "specification": "< 10 CFU/10mL",
      "status": "Pass",
      "approved_by": "EMP-4012"
    },
    {
      "test_name": "Endotoxin",
      "result": "Pending",
      "specification": "< 0.25 EU/mL",
      "status": "In Progress"
    }
  ]
}
```

## How Helix Uses LIMS
During a sterility investigation, the Root Cause Agent correlates MES equipment failure data with LIMS bioburden results to calculate the actual patient risk. If bioburden is 0, the risk is lowered. If bioburden is high, the deviation severity is escalated to Critical.
