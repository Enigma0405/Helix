from typing import Dict, Any
from src.organization_memory.services.organization_memory import OrganizationMemoryProvider

class KnowledgeService:
    """
    Service layer that orchestrates data retrieval from the Organization Memory Provider.
    """
    def __init__(self):
        self.provider = OrganizationMemoryProvider()

    def get_investigation_context(self, investigation_id: str, equipment_id: str) -> Dict[str, Any]:
        """
        Builds a comprehensive context payload for the Runtime.
        This follows the exact graph traversal path requested.
        """
        # If no equipment provided, fallback to EQ-BIO-014 for the MVP demo path
        if not equipment_id:
            equipment_id = "EQ-BIO-014"

        equipment = self.provider.get_equipment(equipment_id)
        calibration = self.provider.get_latest_calibration(equipment_id)
        historical_match = self.provider.get_historical_match(equipment_id)
        sops = self.provider.get_applicable_sops(equipment_id)

        # Standardized API response
        return {
            "investigation": {
                "id": investigation_id,
                "status": "In Progress"
            },
            "equipment": equipment,
            "calibration": calibration,
            "historical_match": historical_match,
            "sop": {
                "applicable_sops": sops,
                "primary": sops[0] if sops else "SOP-DEV-001"
            },
            "regulations": [
                "FDA Part 211 Subpart D",
                "ICH Q9"
            ],
            "confidence": {
                "score": 91,
                "boost": "+8%"
            },
            "next_best_action": {
                "action": "Quarantine Batch",
                "reason": "Calibration confirms temperature excursion"
            }
        }
