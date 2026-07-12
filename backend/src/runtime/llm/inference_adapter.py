from abc import ABC, abstractmethod
from typing import Dict, Any

class InferenceAdapter(ABC):
    """
    Base interface for inference providers.
    Every provider must return a dict that strictly conforms to the InvestigationAssessment schema.
    """
    
    @abstractmethod
    def generate_assessment(self, prompt: str) -> Dict[str, Any]:
        """
        Takes the fully formatted prompt and returns a structured dictionary matching InvestigationAssessment.
        """
        pass
