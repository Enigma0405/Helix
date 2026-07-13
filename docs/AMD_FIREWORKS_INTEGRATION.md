# AMD & Fireworks AI Integration

Helix requires ultra-low-latency reasoning over extremely dense manufacturing parameters (e.g., thousands of lines of batch record telemetry, sensor logs, and standard operating procedures). Generic APIs and standard GPUs introduce latency that breaks the user experience of a real-time Mission Control dashboard.

To solve this, Helix leverages the combination of **Fireworks AI** and **AMD Instinct™ MI300X** accelerators.

## Why Fireworks AI?
Helix demands structured, deterministic outputs from Large Language Models. We use Fireworks AI because of its exceptional implementation of grammar-constrained generation and JSON-mode forcing, allowing us to build the `FireworksAdapter` in our backend.

The `FireworksAdapter` ensures that every LLM response perfectly conforms to our Pydantic schemas (e.g., `RootCauseAssessment` and `CAPADraft`). This prevents the application from crashing due to malformed LLM outputs.

## The Role of AMD Instinct MI300X
Through Fireworks AI, our inference pipelines run on AMD Instinct MI300X accelerators. 

Biopharma quality investigations are deeply context-heavy. A single deviation might require analyzing a 50-page equipment log against a 20-page Standard Operating Procedure (SOP). The MI300X's massive memory bandwidth (up to 5.3 TB/s) and expansive 192GB HBM3 capacity allow Helix to:
1. **Maximize Context Windows:** Ingest entire SOPs and historical CAPA documents in a single shot without aggressive, lossy chunking.
2. **Minimize Time-to-First-Token (TTFT):** Deliver sub-second initial responses, crucial for keeping QA operators in a state of flow during critical investigations.

## Agnostic Architecture Design
While Helix heavily benefits from Fireworks AI and AMD hardware, the core architecture remains provider-agnostic. The `platform/runtime_engine.py` interfaces with standard contracts (`LLMAdapterBase`), meaning Helix can scale across any compatible infrastructure that meets the latency and memory requirements established by the MI300X benchmark.

## Core Model
We rely on **Gemma-4-31b-it** (or similar class open-weight models available on Fireworks AI) for its optimal balance of reasoning capability and inference speed. It performs exceptionally well at cross-verifying raw telemetry against strict SOP rules.
