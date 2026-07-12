from typing import List, Dict, Any
from src.ingestion.models.context import IngestionContext
from src.ingestion.parsers.base import DocumentParser
from src.organization_memory.storage.organization_memory_repository import OrganizationMemoryRepository

class IngestionOrchestrator:
    """
    Coordinates the ingestion pipeline end-to-end.
    Discovery -> Parser -> Repository -> Chunking -> Extraction -> Knowledge
    """
    
    def __init__(
        self, 
        repository: OrganizationMemoryRepository,
        parsers: List[DocumentParser]
    ):
        self.repository = repository
        self.parsers = parsers
        
    def _get_parser(self, content_type: str) -> DocumentParser:
        for parser in self.parsers:
            if parser.supports(content_type):
                return parser
        raise ValueError(f"No parser found for content type: {content_type}")
        
    def process_document(self, context: IngestionContext) -> None:
        """
        Processes a single document through the ingestion pipeline.
        """
        # 1. Parsing
        parser = self._get_parser(context.content_type)
        doc = parser.parse(context)
        
        # 2. Persistence (Canonical JSON)
        self.repository.save_document(context.tenant_id, doc)
        
        # 3. Chunking (Placeholder)
        # chunks = self.chunker.chunk(doc)
        # for chunk in chunks: self.repository.save_chunk(...)
        
        # 4. Entity Extraction (Placeholder)
        # entities = self.entity_extractor.extract(doc)
        
        # 5. Relationship Extraction (Placeholder)
        
        # 6. Embedding & Indexing (Placeholder)
        
        # 7. Update Manifest / State
        pass
