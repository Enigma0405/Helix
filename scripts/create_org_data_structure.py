import os
import shutil

def create_structure():
    base_dir = "backend/organization_data/apex_precision"
    
    directories = [
        "organization_seed/organization",
        "organization_seed/departments",
        "organization_seed/employees",
        "organization_seed/equipment",
        "organization_seed/facilities",
        "organization_seed/operators",
        "organization_seed/products",
        "organization_seed/suppliers",
        "organization_seed/policies",
        "organization_seed/sops",
        "organization_seed/processes",
        "organization_seed/templates",
        "historical_memory/investigations",
        "historical_memory/capas",
        "historical_memory/batch_records",
        "historical_memory/calibration",
        "historical_memory/audit_reports",
        "historical_memory/deviations",
        "demo_evidence/incoming_events",
        "demo_evidence/uploaded_documents",
        "manifests"
    ]
    
    for rel_dir in directories:
        dir_path = os.path.join(base_dir, rel_dir)
        os.makedirs(dir_path, exist_ok=True)
        # Create .gitkeep
        gitkeep_path = os.path.join(dir_path, ".gitkeep")
        if not os.path.exists(gitkeep_path):
            with open(gitkeep_path, "w") as f:
                pass

    # Remove the old temporary organization_seed if it exists at the root of backend
    old_seed = "backend/organization_seed"
    if os.path.exists(old_seed):
        shutil.rmtree(old_seed)

if __name__ == "__main__":
    create_structure()
    print("Created organization_data structure.")
