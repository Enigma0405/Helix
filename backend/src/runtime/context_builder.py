from typing import Dict, Any
from .contracts.investigation_context import InvestigationContextV1
from .runtime_engine import runtime_engine
from src.organization_memory.services.organization_memory import OrganizationMemoryProvider

class ContextBuilder:
    def __init__(self):
        self.knowledge_provider = OrganizationMemoryProvider()
        
    def build_context(self, investigation_id: str, equipment_id: str = "EQ-BIO-014") -> InvestigationContextV1:
        # 1. Get Runtime Snapshot
        snapshot = runtime_engine.get_snapshot(investigation_id)
        
        # 2. Get Knowledge (abstracting this away for now based on B1 simplification)
        equipment = self.knowledge_provider.get_equipment(equipment_id)
        calibration = self.knowledge_provider.get_latest_calibration(equipment_id)
        historical_match = self.knowledge_provider.get_historical_match(equipment_id)
        sops = self.knowledge_provider.get_applicable_sops(equipment_id)
        
        # 3. Assemble Read Model
        return InvestigationContextV1(
            metadata={
                "id": investigation_id,
                "title": "Sterility Deviation",
                "status": "LIVE"
            },
            health={
                "completeness": snapshot.investigationHealth.completeness,
                "compliance": snapshot.investigationHealth.compliance,
                "slaStatus": snapshot.investigationHealth.slaStatus
            },
            momentum=snapshot.momentum,
            evidence=[], # Handled dynamically later
            knowledge={
                "equipment": equipment,
                "calibration": calibration,
                "similarCases": [historical_match] if historical_match else [],
                "sops": sops,
                "regulations": ["FDA Part 211 Subpart D", "ICH Q9"]
            },
            intelligence={
                "timeline": [],
                "rootCause": [],
                "confidence": 84 if snapshot.progress > 0.6 else 42,
                "riskLevel": "HIGH",
                "nextBestAction": {"action": "Quarantine Batch"} if snapshot.progress >= 1.0 else {},
                "counterHypotheses": []
            },
            runtime=snapshot,
            actions={
                "pendingDecisions": []
            }
        )

# Global singleton
context_builder = ContextBuilder()
