# 📁 Golden Cases — Format Specification

Golden cases are the ground truth for the Helix evaluation framework. Each case represents a realistic quality investigation scenario with known expected outputs.

---

## Directory Structure

Each golden case is a **self-contained directory**:

```
golden_cases/
└── <case-slug>/
    ├── investigation.json        # Required: scenario metadata + expected root causes
    ├── expected_hypotheses.json  # Required: expected AI output specification
    ├── expected_capa.json        # Optional: expected CAPA categories
    └── evidence/                 # Optional: synthetic source documents
        ├── sop_sterile_filtration.pdf
        ├── batch_record_2847.pdf
        └── em_report_q3.pdf
```

### Case Slug Naming Convention

```
<batch-or-product-id>_<failure-type>
```

Examples:
- `batch_2847_sterility_failure`
- `lot_A192_potency_ooc`
- `line_3_cross_contamination`

---

## `investigation.json` Schema

```json
{
  "title": "Human-readable investigation title",
  "description": "Detailed description of the quality event",
  "severity": "critical | major | minor",
  "product": "Product name (optional)",
  "batch_lot": "Batch or lot number (optional)",
  "facility": "Facility or area (optional)",
  "expected_root_causes": [
    "List of root causes the AI should identify"
  ],
  "expected_capa_categories": [
    "CAPA action categories the AI should recommend"
  ],
  "tags": ["sterility", "filtration"],
  "regulatory_refs": ["USP <71>", "21 CFR 211.113"]
}
```

### Severity Levels

| Level | Meaning |
|-------|---------|
| `critical` | Product recall risk, patient safety impact |
| `major` | Significant GMP deviation, batch rejection likely |
| `minor` | Process deviation, investigation required but low risk |

---

## `expected_hypotheses.json` Schema

This file defines what the AI **must produce** to pass the evaluation:

```json
{
  "hypotheses": [
    {
      "rank": 1,
      "title": "Hypothesis title",
      "minimum_confidence": 0.7,
      "must_cite_keywords": ["keyword1", "keyword2"]
    }
  ],
  "minimum_grounding_score": 0.8,
  "maximum_hallucination_rate": 0.1,
  "minimum_hypotheses_count": 2,
  "maximum_hypotheses_count": 5
}
```

### Field Definitions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `hypotheses` | array | Yes | List of expected hypothesis specs |
| `rank` | integer | Yes | Expected rank position (1 = highest confidence) |
| `minimum_confidence` | float | Yes | AI must return confidence ≥ this value |
| `must_cite_keywords` | array | No | At least one keyword must appear in citations |
| `minimum_grounding_score` | float | Yes | Ratio of valid citations must meet this floor |
| `maximum_hallucination_rate` | float | Yes | Hallucination rate must not exceed this |
| `minimum_hypotheses_count` | integer | No | Minimum number of hypotheses expected |
| `maximum_hypotheses_count` | integer | No | Maximum number of hypotheses expected |

---

## `expected_capa.json` Schema (Optional)

```json
{
  "capa_actions": [
    {
      "category": "immediate_containment | root_cause | corrective | preventive",
      "must_include_keywords": ["quarantine", "hold"]
    }
  ]
}
```

---

## Scoring Logic

For each case, the evaluator:

1. Creates a new investigation via the API
2. Uploads any evidence files from `evidence/`
3. Triggers hypothesis generation
4. Compares the response against `expected_hypotheses.json`:
   - Checks that required hypotheses are present at the correct rank
   - Verifies confidence scores meet minimums
   - Checks citation keyword coverage
   - Computes grounding score and hallucination rate
5. Scores the case as PASS / FAIL / PARTIAL

A case PASSES only if ALL required conditions are met.

---

## Currently Available Golden Cases

| Case | Severity | Description |
|------|----------|-------------|
| `batch_2847_sterility_failure` | critical | USP <71> sterility failure, injectable product |

*More cases to be added in Sprint D.*
