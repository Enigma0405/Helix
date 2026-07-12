import os
import shutil
import json
from pathlib import Path

def main():
    base = Path(".")
    
    org_id = "apex_precision"
    org_dir = base / "organizations" / org_id
    
    # 1. Directory Structure
    source_data = org_dir / "source_data"
    org_mem = org_dir / "organization_memory"
    
    # Data layer
    os.makedirs(source_data / "organization_seed" / "company", exist_ok=True)
    os.makedirs(source_data / "organization_seed" / "sops", exist_ok=True)
    os.makedirs(source_data / "organization_seed" / "equipment", exist_ok=True)
    os.makedirs(source_data / "organization_seed" / "suppliers", exist_ok=True)
    os.makedirs(source_data / "historical_memory" / "investigations", exist_ok=True)
    os.makedirs(source_data / "historical_memory" / "batch_records", exist_ok=True)
    os.makedirs(source_data / "live_evidence" / "incoming_events", exist_ok=True)
    
    # Memory layer
    os.makedirs(org_mem / "canonical", exist_ok=True)
    os.makedirs(org_mem / "chunks", exist_ok=True)
    os.makedirs(org_mem / "entities", exist_ok=True)
    os.makedirs(org_mem / "relationships", exist_ok=True)
    os.makedirs(org_mem / "metadata", exist_ok=True)
    os.makedirs(org_mem / "manifests", exist_ok=True)
    
    # 2. Config File
    org_config = {
        "organization_id": org_id,
        "display_name": "Apex Precision",
        "domain": "apexprecision.com",
        "timezone": "UTC",
        "default_language": "en",
        "schema_version": "1.0",
        "created_at": "2026-07-12T00:00:00Z",
        "knowledge_version": "1.0",
        "ingestion_version": "1.0",
        "memory_schema_version": "1.0",
        "embedding_version": "1.0",
        "graph_version": "1.0"
    }
    with open(org_dir / "organization.json", "w") as f:
        json.dump(org_config, f, indent=4)
        
    # 3. Document Migration
    old_root = base / "organization_memory"
    if not old_root.exists():
        print("Legacy organization_memory not found! Already migrated?")
        return
        
    pdf_map = {
        "Helix (EvidenceOps) Organization Blueprint (1).pdf": source_data / "organization_seed" / "company",
        "QMS BLUEPRINT.pdf": source_data / "organization_seed" / "company",
        "Historical Quality Knowledge.pdf": source_data / "organization_seed" / "company",
        "Core SOPs (01–20).pdf": source_data / "organization_seed" / "sops",
        "Core SOPs (21–40).pdf": source_data / "organization_seed" / "sops",
        "Core SOPs (41–60).pdf": source_data / "organization_seed" / "sops",
        "Detailed Equipment Files (01–10).pdf": source_data / "organization_seed" / "equipment",
        "Detailed Supplier Files (01–08).pdf": source_data / "organization_seed" / "suppliers",
        "Key Batch Records (01–10).pdf": source_data / "historical_memory" / "batch_records",
        "Investigations & CAPAs (01–15).pdf": source_data / "historical_memory" / "investigations",
        "incoming_quality_event_package_2026_07_11 (1).pdf": source_data / "live_evidence" / "incoming_events",
        "missing_evidence_followup_pack_2026_07_11 (1).pdf": source_data / "live_evidence" / "incoming_events",
        
        # Docs (Type B)
        "Helix Demo Workflows.pdf": base / "docs" / "demos",
        "Integration & Ingestion Plan.pdf": base / "docs" / "architecture",
        "Pilot Deployment Plan.pdf": base / "docs" / "deployment",
        "Summary & Repository Index.pdf": base / "docs" / "indexes",
        
        # Design Docs that probably belong in docs instead of source_data
        "Knowledge Graph Design.pdf": base / "docs" / "architecture",
        "Injectra Subgraph Export (JSON).pdf": base / "docs" / "architecture"
    }
    
    # Ensure doc folders exist
    os.makedirs(base / "docs" / "demos", exist_ok=True)
    os.makedirs(base / "docs" / "architecture", exist_ok=True)
    os.makedirs(base / "docs" / "deployment", exist_ok=True)
    os.makedirs(base / "docs" / "indexes", exist_ok=True)
    
    # Move files
    for root, dirs, files in os.walk(old_root):
        for f in files:
            if f.endswith(".pdf"):
                if f in pdf_map:
                    dest = pdf_map[f] / f
                    if not (pdf_map[f] / f).exists():
                        print(f"Moving {f} to {pdf_map[f]}")
                        shutil.move(str(Path(root) / f), str(dest))
                else:
                    print(f"Unknown PDF: {f}")
                    
    # Move Manifest
    manifest_src = old_root / "manifest.json"
    manifest_dst = org_mem / "metadata" / "ingestion_manifest.json"
    if manifest_src.exists():
        print(f"Moving manifest to {manifest_dst}")
        shutil.move(str(manifest_src), str(manifest_dst))
        
    # 4. Safe Cleanup Strategy (Archive)
    if old_root.exists():
        legacy_root = base / "organization_memory_legacy"
        if legacy_root.exists():
            shutil.rmtree(legacy_root)
        print("Archiving organization_memory -> organization_memory_legacy")
        os.rename(old_root, legacy_root)
        
    old_data = base / "backend" / "organization_data"
    if old_data.exists():
        legacy_data = base / "backend" / "organization_data_legacy"
        if legacy_data.exists():
            shutil.rmtree(legacy_data)
        print("Archiving backend/organization_data -> backend/organization_data_legacy")
        os.rename(old_data, legacy_data)
        
    print("Migration Complete.")

if __name__ == "__main__":
    main()
