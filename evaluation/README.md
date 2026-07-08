# 📏 Evaluation Framework — Project Helix

> "Evaluation is first-class" — Engineering Principle #3

The Helix evaluation framework provides **automated, reproducible scoring** of the AI pipeline against golden test cases. It runs in CI and locally, and blocks PRs that regress on key metrics.

---

## Why This Exists

LLM-powered applications have a fundamental challenge: how do you know if a model change made things better or worse? Traditional unit tests can't answer this. Helix solves this with:

1. **Golden Cases** — ground-truth investigation scenarios with expected outputs
2. **Metrics** — quantitative measures of retrieval quality, citation accuracy, and latency
3. **Automated Scoring** — a script that runs all cases and produces a pass/fail report
4. **Threshold Enforcement** — CI fails if any metric falls below its target

---

## Directory Structure

```
evaluation/
├── README.md                       # This file
├── run_evaluation.py               # Main evaluation runner
├── golden_cases/
│   ├── README.md                   # Golden case format spec
│   └── batch_2847_sterility_failure/
│       ├── investigation.json      # Case metadata + expected root causes
│       ├── expected_hypotheses.json# Expected AI output spec
│       └── evidence/               # Synthetic PDFs (placeholder)
├── metrics/
│   ├── README.md                   # Metric definitions
│   └── definitions.json            # Machine-readable metric specs
└── benchmarks/
    └── README.md                   # Benchmark methodology
```

---

## Metrics Overview

| Metric | Target | Description |
|--------|--------|-------------|
| `retrieval_recall_at_5` | ≥ 0.80 | % relevant chunks in top-5 results |
| `citation_precision` | ≥ 0.90 | % of citations that are valid |
| `grounding_score` | ≥ 0.80 | Ratio of valid citations to total |
| `hallucination_rate` | ≤ 0.10 | % of fabricated/unverifiable claims |
| `hypothesis_latency_p95_ms` | ≤ 10,000 | 95th percentile response time (ms) |
| `cost_per_investigation_usd` | ≤ $0.50 | Total token cost per investigation |
| `time_to_initial_hypothesis_min` | ≤ 5 | Minutes from upload to first hypothesis |

Full definitions: [metrics/definitions.json](metrics/definitions.json)

---

## Running the Evaluation

### Prerequisites

```bash
pip install httpx rich pytest
```

### Run against local stack

```bash
# Start the stack first
docker compose up -d

# Run all golden cases
python evaluation/run_evaluation.py

# Run with custom API URL
python evaluation/run_evaluation.py --api-url http://localhost/api

# Run a single case
python evaluation/run_evaluation.py --case batch_2847_sterility_failure

# Output JSON report
python evaluation/run_evaluation.py --output-format json > results.json
```

### CI Integration

The evaluation runner exits with code `0` if all metrics pass, `1` if any fail.

```yaml
# .github/workflows/eval.yml (example)
- name: Run Helix Evaluation
  run: python evaluation/run_evaluation.py --api-url ${{ env.API_URL }}
```

---

## Adding a New Golden Case

1. Create a new directory under `golden_cases/` with a descriptive slug
2. Add `investigation.json` with the scenario metadata
3. Add `expected_hypotheses.json` with the expected AI outputs
4. Add any evidence PDFs to `evidence/` subdirectory
5. Run the evaluation locally to verify the case works

See [golden_cases/README.md](golden_cases/README.md) for the full format spec.

---

## Evaluation Philosophy

- **Determinism** — mock mode returns fixed responses so CI is reproducible
- **Provider parity** — the same cases run against `mock`, `fireworks`, and `openai`
- **No cherry-picking** — all golden cases run every time; no skipping
- **Threshold ratchet** — once a metric improves, the threshold is raised; no regressions allowed
