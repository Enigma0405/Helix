# Canonical Memory Schema Contract

This document defines the core data contracts for the Helix Organization Memory. Every parser, extractor, chunker, and generator in the ingestion pipeline MUST adhere to these canonical schemas.

This guarantees deterministic output, allows the AI Runtime to consume stable inputs, and ensures that the memory can be rebuilt safely from immutable source data.

---

## 1. CanonicalDocument
The foundational output of the Parser. Represents a normalized version of an immutable source file (PDF, CSV, XLSX, etc.) into clean text and extracted semantic metadata.

```json
{
  "doc_id": "doc_12345",
  "source_file": "organizations/apex_precision/source_data/organization_seed/sops/Core SOPs (01-20).pdf",
  "hash": "sha256_of_original_file",
  "content_type": "text/markdown",
  "title": "Core SOPs Volume 1",
  "normalized_content": "# Standard Operating Procedure...",
  "metadata": {
    "author": "Apex Quality Team",
    "effective_date": "2026-01-01",
    "page_count": 25,
    "parser_version": "1.0.0"
  },
  "ingested_at": "2026-07-12T12:00:00Z"
}
```

---

## 2. CanonicalChunk
The output of the Chunker. Represents a semantically cohesive block of text from a `CanonicalDocument`, optimized for vector embedding and retrieval.

```json
{
  "chunk_id": "chunk_12345_001",
  "doc_id": "doc_12345",
  "text": "SOP-001: All calibration logs must be reviewed weekly.",
  "start_char_idx": 1024,
  "end_char_idx": 1078,
  "semantic_context": "SOP-001 > Section 2: Requirements",
  "embedding_id": "vec_998877",
  "tokens": 12
}
```

---

## 3. CanonicalEntity
The output of the Entity Extractor. Represents a deterministic, machine-readable business object (e.g., an Employee, an Equipment ID, a Deviation) found within the documents.

```json
{
  "entity_id": "eqp_7741",
  "entity_type": "Equipment",
  "display_name": "Bioreactor Alpha",
  "properties": {
    "manufacturer": "BioSystems Inc",
    "installation_date": "2023-05-12",
    "status": "Active"
  },
  "mentions": [
    "chunk_12345_001",
    "chunk_12345_089"
  ]
}
```

---

## 4. CanonicalRelationship
The output of the Relationship Extractor (Graph Generator). Defines directed edges between `CanonicalEntity` nodes, forming the Organization Knowledge Graph.

```json
{
  "relationship_id": "rel_5521",
  "source_entity_id": "eqp_7741",
  "target_entity_id": "sop_001",
  "relation_type": "GOVERNED_BY",
  "weight": 1.0,
  "evidence_chunks": [
    "chunk_12345_001"
  ],
  "context": "Bioreactor Alpha must be calibrated according to SOP-001."
}
```

---

## 5. CanonicalEvidence
Used exclusively during Live Investigations by the AI Runtime. Represents real-world events or anomalies mapped against the established Organization Memory.

```json
{
  "evidence_id": "ev_888",
  "investigation_id": "inv_9090",
  "source_event": "organizations/apex_precision/source_data/live_evidence/incoming_events/complaint_44.pdf",
  "description": "Temperature anomaly detected in Bioreactor Alpha.",
  "extracted_entities": [
    "eqp_7741"
  ],
  "timestamp": "2026-07-12T14:00:00Z",
  "confidence_score": 0.95
}
```

---

## 6. CanonicalMetadata
Tracks the state, versioning, and integrity of the ingestion process for the organization memory.

```json
{
  "schema_version": "1.0",
  "last_ingestion_run": "2026-07-12T12:00:00Z",
  "parser_version": "1.0.0",
  "entity_extractor_version": "1.2.0",
  "total_documents": 21,
  "total_chunks": 4050,
  "total_entities": 850,
  "total_relationships": 1200,
  "integrity_hash": "sha256_hash_of_all_canonical_data"
}
```
