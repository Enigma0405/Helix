# ADR-003: Ingestion Pipeline Boundaries

## Decision
Establish a strict, multi-stage, deterministic ingestion pipeline comprising: Discovery, Parser, Classifier, Validator, Mapper, Normalizer, Verifier, Persistence, and Logging.

## Reason
Enterprise ingestion must be highly auditable, deterministic, and idempotent. Processing raw unstructured data directly into embeddings skips critical validation steps, leading to hallucinations and untrusted data. A staged pipeline ensures every document is normalized to Canonical JSON before entering Organization Memory.

## Alternatives Considered
- Direct LLM ingestion (throwing raw PDFs at an LLM): Rejected due to cost, latency, non-determinism, and hallucination risks.
- Monolithic ingestion script: Rejected as it becomes unmaintainable and impossible to test individual stages (e.g., testing parsing independently of classification).

## Consequences
- AI/LLMs are only invoked during ingestion if the deterministic parser's confidence falls below a threshold.
- Re-importing a document will trigger idempotency checks (SHA-256 matching) to avoid duplicate knowledge.
- Requires building distinct interfaces for each pipeline stage.
