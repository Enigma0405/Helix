from typing import Dict, Type
from src.ingestion.parsers.base import DocumentParser

class ParserRegistry:
    """
    Registry for mapping MIME types to specific DocumentParser implementations.
    Keeps Discovery agnostic of the actual parsing logic.
    """
    
    def __init__(self):
        self._parsers: Dict[str, DocumentParser] = {}
        
    def register(self, parser: DocumentParser) -> None:
        """
        Registers a parser for all MIME types it supports.
        """
        for content_type in parser.SUPPORTED_TYPES:
            self._parsers[content_type.lower()] = parser
            
    def get_parser(self, content_type: str) -> DocumentParser:
        """
        Returns a parser instance for the given MIME type, or raises ValueError.
        """
        content_type = content_type.lower()
        if content_type not in self._parsers:
            raise ValueError(f"No parser registered for content type: {content_type}")
        return self._parsers[content_type]
