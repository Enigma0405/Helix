import os
import shutil
import json

knowledge_dir = "knowledge"
out_dir = "organization_memory"

# Mapping original PDF filenames to their intended directory in organization_memory/organization/
# based on the prompt's structural hints.
mapping = {
    "Helix (EvidenceOps) Organization Blueprint (1).pdf": "phase_0_1",
    "QMS BLUEPRINT.pdf": "phase_0_1",
    "Historical Quality Knowledge.pdf": "phase_0_4",
    "Summary & Repository Index.pdf": "phase_0_5/summary",
    "Master Index Blueprint (Part 1).pdf": "phase_0_5/master_index",
    "Master Index Blueprint (Part 2).pdf": "phase_0_5/master_index",
    "Master Index Blueprint (Part 3).pdf": "phase_0_5/master_index",
    "Core SOPs (01–20).pdf": "phase_0_5/sops",
    "Core SOPs (21–40).pdf": "phase_0_5/sops",
    "Core SOPs (41–60).pdf": "phase_0_5/sops",
    "Key Batch Records (01–10).pdf": "phase_0_5/batch_records",
    "Investigations & CAPAs (01–15).pdf": "phase_0_5/investigations",
    "Detailed Equipment Files (01–10).pdf": "phase_0_5/equipment",
    "Detailed Supplier Files (01–08).pdf": "phase_0_5/suppliers",
    "incoming_quality_event_package_2026_07_11 (1).pdf": "phase_0_5/incoming_events",
    "missing_evidence_followup_pack_2026_07_11 (1).pdf": "phase_0_5/incoming_events",
    "Knowledge Graph Design.pdf": "phase_0_6",
    "Injectra Subgraph Export (JSON).pdf": "phase_0_6",
    "Helix Demo Workflows.pdf": "phase_0_7",
    "Integration & Ingestion Plan.pdf": "phase_0_9",
    "Pilot Deployment Plan.pdf": "phase_1"
}

priority_map = {
    "phase_0_1": 1,
    "phase_0_4": 2,
    "phase_0_5/master_index": 3,
    "phase_0_5/sops": 4,
    "phase_0_5/equipment": 5,
    "phase_0_5/suppliers": 6,
    "phase_0_5/batch_records": 7,
    "phase_0_5/investigations": 8,
    "phase_0_5/incoming_events": 9,
    "phase_0_6": 12
}

def main():
    if os.path.exists(out_dir):
        shutil.rmtree(out_dir)
    os.makedirs(out_dir, exist_ok=True)
    
    manifest = []
    
    for filename, rel_dir in mapping.items():
        src_path = os.path.join(knowledge_dir, filename)
        if not os.path.exists(src_path):
            print(f"Warning: {filename} not found.")
            continue
            
        dest_dir = os.path.join(out_dir, "organization", rel_dir)
        os.makedirs(dest_dir, exist_ok=True)
        dest_path = os.path.join(dest_dir, filename)
        
        shutil.copy2(src_path, dest_path)
        
        # Determine Type A or Type B
        # Type A: Organization Blueprint, Historical Knowledge, Master Index, SOPs, Batch Records, 
        # Investigations, Equipment, Suppliers, Incoming Events, Knowledge Graph
        # Type B: Integration Plan, Demo Workflow, Pilot Deployment, Repository Summary
        is_type_b = (
            "summary" in rel_dir or 
            "phase_0_7" in rel_dir or 
            "phase_0_9" in rel_dir or 
            "phase_1" in rel_dir
        )
        
        priority = priority_map.get(rel_dir, 99)
        
        manifest.append({
            "filename": filename,
            "phase": rel_dir.split('/')[0],
            "document_type": "PDF",
            "entity_type": "Project Documentation" if is_type_b else "Organization Knowledge",
            "relationships": [],
            "ingestion_priority": None if is_type_b else priority,
            "knowledge_category": rel_dir.split('/')[-1],
            "status": "pending_ingestion" if not is_type_b else "do_not_ingest",
            "checksum_placeholder": "CHECKSUM_TBD"
        })
        
    # Write manifest
    with open(os.path.join(out_dir, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=4)
        
    # Write README
    readme_content = """# Aetheris BioPharma Organization Knowledge Pack

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
"""
    with open(os.path.join(out_dir, "README.md"), "w", encoding="utf-8") as f:
        f.write(readme_content)

if __name__ == "__main__":
    main()
