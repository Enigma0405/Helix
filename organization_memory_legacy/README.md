# Aetheris BioPharma Organization Knowledge Pack

This directory (`organization_memory/`) serves as the authoritative source of truth for the Aetheris BioPharma organization knowledge pack.

## Folder Structure
- `organization/`: Contains all phases (0.1 through 1.0) of the knowledge integration pack.
- `manifest.json`: The master registry defining ingestion priority, categories, and checksums.

## Purpose
This repository contains both historical and active organization data that will be ingested into the Helix EvidenceOps platform to build the Organization Memory. It also contains project documentation.

## Document Categories
- **Type A (Organization Knowledge)**: Will be ingested (Blueprints, SOPs, Equipment, Batch Records, Investigations, Incoming Events, Knowledge Graph).
- **Type B (Project Documentation)**: Will NOT be ingested (Integration Plans, Demo Workflows, Pilot Deployments, Summaries).

## Ingestion Sequence
Ingestion is strictly deterministic and ordered to resolve dependencies correctly:
1. Organization Blueprint
2. Historical Knowledge
3. Master Index
4. Detailed SOPs
5. Equipment
6. Suppliers
7. Batch Records
8. Historical Investigations
9. Incoming Evidence Package
10. Missing Evidence Follow-up Pack
11. Incoming Packages 02-04
12. Knowledge Graph

## How Helix Consumes These Files
The Helix backend ingestion pipeline (`backend/src/ingestion/`) will scan this directory. It will read `manifest.json` to determine the correct ingestion order. It will not modify or delete these source files.

## How Future Companies Plug Into the Same Architecture
Future customers or organizations can be onboarded by supplying a similarly structured `organization_memory/` repository with their own PDFs and a corresponding `manifest.json`. The Helix ingestion engine is tenant-agnostic and relies on the manifest structure rather than hardcoded rules.
