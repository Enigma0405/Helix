import os
from pathlib import Path

def create_structure():
    base_dir = Path("organizations")
    
    # Define directories
    directories = [
        "apex_precision/organization_seed/employees",
        "apex_precision/organization_seed/departments",
        "apex_precision/organization_seed/products",
        "apex_precision/organization_seed/equipment",
        "apex_precision/organization_seed/suppliers",
        "apex_precision/organization_seed/processes",
        "apex_precision/organization_seed/policies",
        "apex_precision/organization_seed/sops",
        "apex_precision/organization_seed/templates",
        "apex_precision/historical_memory/investigations",
        "apex_precision/historical_memory/capas",
        "apex_precision/historical_memory/batch_records",
        "apex_precision/historical_memory/audit_reports",
        "apex_precision/historical_memory/deviations",
        "apex_precision/demo_evidence/incoming_events",
        "apex_precision/demo_evidence/uploaded_documents",
        "apex_precision/manifests"
    ]
    
    # Create directories and .gitkeep
    for d in directories:
        dir_path = base_dir / d
        dir_path.mkdir(parents=True, exist_ok=True)
        (dir_path / ".gitkeep").touch()
        
    # Create organization.json
    org_json_path = base_dir / "apex_precision/organization.json"
    with open(org_json_path, "w") as f:
        f.write('{\n  "id": "apex_precision",\n  "name": "Apex Precision"\n}\n')

if __name__ == "__main__":
    create_structure()
