# 📊 Metrics — Definitions & Targets

This document describes all metrics tracked by the Helix evaluation framework. Each metric has a clear definition, unit, measurement method, and target threshold.

---

## Retrieval Metrics

### `retrieval_recall_at_5`

| Property | Value |
|----------|-------|
| **Unit** | ratio (0.0–1.0) |
| **Target** | ≥ 0.80 |
| **Direction** | Higher is better |

**Definition:** The proportion of "relevant" document chunks that appear in the top-5 results returned by the vector similarity search.

**Measurement:** For each golden case, we pre-label a set of chunks as "relevant" (those that contain the expected root cause evidence). We then query the retrieval system and check how many of those labeled chunks appear in the top-5 results.

```
recall@5 = |relevant_chunks ∩ top_5_results| / |relevant_chunks|
```

**Why it matters:** If relevant evidence isn't retrieved, the AI can't use it. Low recall means the AI is making things up or missing key evidence.

---

### `retrieval_precision_at_5`

| Property | Value |
|----------|-------|
| **Unit** | ratio (0.0–1.0) |
| **Target** | ≥ 0.60 |
| **Direction** | Higher is better |

**Definition:** The proportion of top-5 retrieved chunks that are actually relevant.

```
precision@5 = |relevant_chunks ∩ top_5_results| / 5
```

---

## Citation Quality Metrics

### `citation_precision`

| Property | Value |
|----------|-------|
| **Unit** | ratio (0.0–1.0) |
| **Target** | ≥ 0.90 |
| **Direction** | Higher is better |

**Definition:** The proportion of citations included in an AI response that can be verified against the evidence corpus in the database.

**Measurement:** After receiving a hypothesis response, each citation is cross-referenced against the stored chunks in the database. A citation is "valid" if the chunk ID exists and the referenced text matches.

```
citation_precision = valid_citations / total_citations
```

**Why it matters:** High citation precision means the AI is pointing to real evidence. Low precision indicates hallucinated or fabricated references.

---

### `grounding_score`

| Property | Value |
|----------|-------|
| **Unit** | ratio (0.0–1.0) |
| **Target** | ≥ 0.80 |
| **Direction** | Higher is better |

**Definition:** The ratio of verified citations to total claims made in a response. Similar to citation precision but measured at the claim level rather than the citation level.

**Measurement:** Each factual claim in the AI response is tagged as "grounded" (has a valid citation) or "ungrounded" (no citation or invalid citation).

```
grounding_score = grounded_claims / total_claims
```

---

### `hallucination_rate`

| Property | Value |
|----------|-------|
| **Unit** | ratio (0.0–1.0) |
| **Target** | ≤ 0.10 |
| **Direction** | Lower is better |

**Definition:** The proportion of AI responses that contain at least one fabricated or unverifiable citation.

**Measurement:** A response is flagged as "hallucinated" if it contains any citation that cannot be verified against the evidence corpus.

```
hallucination_rate = responses_with_invalid_citations / total_responses
```

**Why it matters:** In a regulated quality investigation, a single hallucinated citation can invalidate an entire CAPA. This metric must stay very low.

---

## Latency Metrics

### `hypothesis_latency_p95_ms`

| Property | Value |
|----------|-------|
| **Unit** | milliseconds |
| **Target** | ≤ 10,000 ms (10 seconds) |
| **Direction** | Lower is better |

**Definition:** The 95th percentile end-to-end latency for the hypothesis generation endpoint, measured from request receipt to full response delivery.

**Measurement:** Timed during evaluation runs across all golden cases. We report p50, p95, and p99.

---

## Cost Metrics

### `cost_per_investigation_usd`

| Property | Value |
|----------|-------|
| **Unit** | USD |
| **Target** | ≤ $0.50 |
| **Direction** | Lower is better |

**Definition:** Total estimated cost of all AI API calls (inference + embedding) required to complete one investigation from evidence upload to CAPA generation.

**Measurement:** Tokens consumed × provider pricing. Tracked via the `ai_usage_log` table in the database.

---

## End-to-End Metrics

### `time_to_initial_hypothesis_minutes`

| Property | Value |
|----------|-------|
| **Unit** | minutes |
| **Target** | ≤ 5 minutes |
| **Direction** | Lower is better |

**Definition:** Wall-clock time from evidence file upload completion to the display of the first ranked hypothesis to the user.

This is the **primary user-facing metric** — it directly measures the platform's core value proposition.

---

## How Metrics Are Reported

After an evaluation run, the runner prints a table like:

```
┌─────────────────────────────────┬──────────┬──────────┬────────┐
│ Metric                          │ Target   │ Actual   │ Status │
├─────────────────────────────────┼──────────┼──────────┼────────┤
│ retrieval_recall_at_5           │ ≥ 0.80   │ 0.87     │ ✅ PASS│
│ citation_precision              │ ≥ 0.90   │ 0.94     │ ✅ PASS│
│ grounding_score                 │ ≥ 0.80   │ 0.91     │ ✅ PASS│
│ hallucination_rate              │ ≤ 0.10   │ 0.03     │ ✅ PASS│
│ hypothesis_latency_p95_ms       │ ≤ 10000  │ 4823     │ ✅ PASS│
│ cost_per_investigation_usd      │ ≤ $0.50  │ $0.12    │ ✅ PASS│
│ time_to_initial_hypothesis_min  │ ≤ 5 min  │ 1.8 min  │ ✅ PASS│
└─────────────────────────────────┴──────────┴──────────┴────────┘
```
