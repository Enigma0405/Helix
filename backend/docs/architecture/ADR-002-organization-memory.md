# ADR-002: Organization Memory Separation

## Decision
Separate the storage of normalized structured truth (Canonical JSON) into an `organization_memory` domain, while keeping AI-specific retrieval, embeddings, and similarity search in the `knowledge` domain.

## Reason
Raw documents imported from the `organization_seed` are processed into a unified, canonical representation. This "truth" data is functionally distinct from the vector embeddings used to search it. Mixing them in a single `knowledge` module blurs the line between source-of-truth storage and AI-augmented retrieval.

## Alternatives Considered
- Keeping everything in `knowledge/`: Rejected because "knowledge" is ambiguous and often conflated with embeddings and LLM context, rather than the raw parsed enterprise data.
- Naming it `database`: Rejected because Organization Memory is a specific business concept representing the company's rules, SOPs, and historical data, not just any database table.

## Consequences
- `organization_memory` becomes the authoritative source for structured enterprise data.
- The `knowledge` domain depends on `organization_memory` to generate embeddings.
- Simplifies testing and querying of raw canonical data without invoking AI infrastructure.
