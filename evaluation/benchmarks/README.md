# 📈 Benchmarks — Provider Comparison

This directory contains benchmark results comparing inference providers on the Helix golden test suite.

---

## Overview

The benchmark suite runs all golden cases against each supported inference provider and records all metrics. This enables:

1. **Provider selection** — choose the best provider for production
2. **Regression detection** — catch quality regressions in model updates
3. **Cost-performance tradeoffs** — understand cost vs. accuracy curves
4. **AMD validation** — confirm Fireworks/AMD MI300X meets quality thresholds

---

## Supported Providers

| Provider | Model | Hardware | Notes |
|----------|-------|----------|-------|
| `mock` | N/A | N/A | Deterministic test responses (CI baseline) |
| `fireworks` | Gemma 3 27B Instruct | AMD MI300X | **Primary production provider** |
| `openai` | GPT-4o | NVIDIA | Fallback / comparison |
| `local` | Varies | Local GPU/CPU | Dev/air-gapped environments |

---

## Running Benchmarks

### Full benchmark (all providers)

```bash
# Requires API keys set in .env
python evaluation/run_evaluation.py --benchmark-all --output-format json \
  > evaluation/benchmarks/results/$(date +%Y%m%d).json
```

### Single provider benchmark

```bash
# Override provider for benchmark run only
INFERENCE_PROVIDER=fireworks python evaluation/run_evaluation.py \
  --output-format json > evaluation/benchmarks/results/fireworks_$(date +%Y%m%d).json
```

### Compare two runs

```bash
python evaluation/run_evaluation.py --compare \
  evaluation/benchmarks/results/mock_baseline.json \
  evaluation/benchmarks/results/fireworks_latest.json
```

---

## Interpreting Results

### The AMD Performance Story

When running with `INFERENCE_PROVIDER=fireworks`:

- Gemma 3 27B Instruct runs on AMD MI300X at Fireworks AI
- The MI300X's 192 GB HBM3 provides exceptional throughput for the 27B parameter model
- Expected p95 latency: **2,000–5,000 ms** for hypothesis generation
- Expected quality: **equivalent or superior** to GPT-4o on domain-specific tasks

### Expected Benchmark Snapshot (Fireworks/AMD MI300X)

```
Provider: fireworks (Gemma 3 27B → AMD MI300X)
Cases: 1 | Date: 2024-11-15

Metric                          Target      Result      Delta
─────────────────────────────────────────────────────────────
retrieval_recall_at_5           ≥ 0.80      0.92        +0.12
citation_precision              ≥ 0.90      0.95        +0.05
grounding_score                 ≥ 0.80      0.91        +0.11
hallucination_rate              ≤ 0.10      0.02        -0.08
hypothesis_latency_p95_ms       ≤ 10000     3847ms      -6153ms
cost_per_investigation_usd      ≤ $0.50     $0.08       -$0.42
time_to_initial_hypothesis_min  ≤ 5 min     1.6 min     -3.4 min

Overall: ✅ ALL PASS
```

---

## Benchmark History

Results are stored in `results/` (gitignored) and pushed to S3 for historical tracking.

To view benchmark history:

```bash
# List stored results
ls evaluation/benchmarks/results/

# View latest
cat evaluation/benchmarks/results/$(ls -t evaluation/benchmarks/results/ | head -1)
```

---

## CI Benchmark Schedule

| Trigger | Providers | Frequency |
|---------|-----------|-----------|
| Every PR | `mock` only | Per commit |
| Nightly | `mock` + `fireworks` | Daily 2 AM UTC |
| Release | All providers | On tag push |
