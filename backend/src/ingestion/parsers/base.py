from abc import ABC, abstractmethod
from typing import ClassVar, List
from src.ingestion.models.context import IngestionContext
from src.organization_memory.models import CanonicalDocument

class DocumentParser(ABC):
    """
    The interface every file parser must implement. 
    It takes an IngestionContext and returns a deterministic CanonicalDocument.
    """
    
    # Optional class-level property to declare supported mime types
    SUPPORTED_TYPES: ClassVar[List[str]] = []
    
    @abstractmethod
    def supports(self, content_type: str) -> bool:
        """
        Returns True if this parser can handle the given MIME type.
        """
        pass

    @abstractmethod
    def parse(self, context: IngestionContext) -> CanonicalDocument:
        """
        Parses the file and returns a deterministic CanonicalDocument.
        """
        pass
