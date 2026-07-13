import json
import os
from pathlib import Path

def setup_dirs():
    base = Path("data/organization_memory")
    dirs = ["equipment", "sops", "relationships"]
    for d in dirs:
        (base / d).mkdir(parents=True, exist_ok=True)
    return base

def extract_canonical_knowledge():
    """
    Simulates the extraction of knowledge from PDFs into Canonical JSON.
    For the hackathon MVP, we are seeding the known entities from the Aetheris BioPharma tenant.
    """
    base = setup_dirs()
    
    # 1. Equipment: EQ-FIL-008
    eq_fil_008 = {
        "entity_id": "EQ-FIL-008",
        "name": "Sterile Filter Emflon II",
        "type": "Filtration",
        "manufacturer": "Pall Corporation",
        "calibration_due": "2026-07-12",
        "status": "Active",
        "department": "Manufacturing"
    }
    with open(base / "equipment" / "EQ-FIL-008.json", "w") as f:
        json.dump(eq_fil_008, f, indent=2)

    # 2. SOP: SOP-STER-014
    sop_ster_014 = {
        "entity_id": "SOP-STER-014",
        "title": "Sterilization Procedures for Grade B Corridors",
        "version": "v2.4",
        "effective_date": "2025-01-15",
        "department": "Quality Assurance",
        "thresholds": [
            {
                "parameter": "Wetting Time",
                "condition": "minimum",
                "value": "5 minutes",
                "context": "continuous wetting prior to forward flow integrity test"
            }
        ]
    }
    with open(base / "sops" / "SOP-STER-014.json", "w") as f:
        json.dump(sop_ster_014, f, indent=2)

    # 3. Relationships
    relationships = [
        {
            "source_entity": "SOP-STER-014",
            "relationship": "governs",
            "target_entity": "EQ-FIL-008",
            "confidence": 1.0,
            "origin_document": "Core SOPs (01–20).pdf",
            "section": "3.1.2 Filtration Constraints"
        }
    ]
    with open(base / "relationships" / "equipment_relationships.json", "w") as f:
        json.dump(relationships, f, indent=2)

    print("Canonical knowledge extracted and JSON written to data/organization_memory/")

if __name__ == "__main__":
    extract_canonical_knowledge()
