# Project Helix — RC5 Model Benchmarking Report

This report evaluates and compares candidate Fireworks AI models for Project Helix's automated root-cause analysis (RAG) and CAPA drafting pipelines under the rotated API key.

## Benchmark Results

| Model Name | Deployed Status | Average Latency | Approximate Cost / Call | Schema Compliance (JSON) |
|---|---|---|---|---|
| **Gemma 4 31B IT** | Inaccessible (404) | N/A | N/A | N/A |
| **Gemma 3 27B IT** | Inaccessible (404) | N/A | N/A | N/A |
| **DeepSeek v4 Pro** | **Available (200)** | 7716.12 ms | $0.000116 | **Yes** |
| **GLM 5p1** | **Available (200)** | 14496.49 ms | $0.000232 | **Yes** |

## Recommendation

*   **Default Submission Model**: **DeepSeek v4 Pro** (`accounts/fireworks/models/deepseek-v4-pro`)
*   **Justification**: Under the judging account's API key credentials, Gemma models return `404 Not Found`. DeepSeek v4 Pro is fully deployed, has high schema compliance, low latency, and is extremely cost-effective.
*   **Fallback Sequence**: The adapter configuration automatically attempts: Gemma 4 -> Gemma 3 -> DeepSeek v4 Pro, guaranteeing immediate failover readiness if Gemma models are deployed on the judge's cluster.
