import json
import os
import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

class OrganizationMemoryProvider:
    """
    Temporary provider that reads the Knowledge Pack from the `docs/` folder.
    In the target architecture, this will be replaced by direct Database queries
    to Neon PostgreSQL. The interface remains the same.
    """
    def __init__(self, docs_path: str = None):
        if not docs_path:
            # Assuming backend is run from `backend/` directory, docs is at `../docs`
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            self.docs_path = os.path.join(os.path.dirname(base_dir), "docs")
        else:
            self.docs_path = docs_path
            
        self.datasets_path = os.path.join(self.docs_path, "05-Datasets", "ApexPrecision")
        self.regulatory_path = os.path.join(self.docs_path, "04-Regulatory")
        
        # In-memory cache
        self.equipment: List[Dict[str, Any]] = []
        self.calibration: List[Dict[str, Any]] = []
        self.historical_cases: List[Dict[str, Any]] = []
        self.operators: List[Dict[str, Any]] = []
        self.facilities: List[Dict[str, Any]] = []
        
        self._load_data()

    def _load_data(self):
        try:
            self.equipment = self._read_json("Equipment.json")
            self.calibration = self._read_json("CalibrationHistory.json")
            self.historical_cases = self._read_json("HistoricalInvestigations.json")
            self.operators = self._read_json("Operators.json")
            self.facilities = self._read_json("Facilities.json")
            logger.info("Successfully loaded Organization Memory from Knowledge Pack.")
        except Exception as e:
            logger.error(f"Failed to load Organization Memory: {e}")

    def _read_json(self, filename: str) -> List[Dict[str, Any]]:
        path = os.path.join(self.datasets_path, filename)
        if os.path.exists(path):
            with open(path, 'r', encoding='utf-8') as f:
                return json.load(f)
        logger.warning(f"Knowledge file missing: {path}")
        return []

    def get_equipment(self, equipment_id: str) -> Dict[str, Any]:
        return next((eq for eq in self.equipment if eq.get("equipment_id") == equipment_id), {})

    def get_latest_calibration(self, equipment_id: str) -> Dict[str, Any]:
        calibrations = [c for c in self.calibration if c.get("equipment_id") == equipment_id]
        if calibrations:
            # Sort by date descending (assuming format YYYY-MM-DD)
            calibrations.sort(key=lambda x: x.get("date_performed", ""), reverse=True)
            return calibrations[0]
        return {}

    def get_historical_match(self, equipment_id: str) -> Dict[str, Any]:
        """Finds a relevant historical case for the given equipment."""
        matches = [h for h in self.historical_cases if h.get("equipment_id") == equipment_id]
        if matches:
            return matches[0]
        return {}

    def get_applicable_sops(self, equipment_id: str) -> List[str]:
        eq = self.get_equipment(equipment_id)
        return eq.get("governing_sops", [])
