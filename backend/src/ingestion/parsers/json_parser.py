import json
import hashlib
from typing import ClassVar, List
from datetime import datetime
from pathlib import Path

from src.ingestion.parsers.base import DocumentParser
from src.ingestion.models.context import IngestionContext
from src.organization_memory.models import CanonicalDocument
from src.shared.logging import ingestion_logger

class JsonParser(DocumentParser):
    SUPPORTED_TYPES: ClassVar[List[str]] = ["application/json"]
    
    def supports(self, content_type: str) -> bool:
        return content_type.lower() in self.SUPPORTED_TYPES
        
    def _generate_hash(self, file_path: Path) -> str:
        h = hashlib.sha256()
        with open(file_path, "rb") as f:
            while chunk := f.read(65536):
                h.update(chunk)
        return h.hexdigest()
        
    def parse(self, context: IngestionContext) -> CanonicalDocument:
        ingestion_logger.info(f"JsonParser processing {context.source_path}")
        
        file_hash = self._generate_hash(context.source_path)
        
        try:
            with open(context.source_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            # Pretty print json to text for the chunker to read it
            full_text = json.dumps(data, indent=2)
        except Exception as e:
            ingestion_logger.error(f"Failed to parse JSON {context.source_path}: {e}")
            full_text = f"ERROR: Failed to parse JSON - {e}"
            data = {}
            
        title = context.source_path.stem
        
        canonical_metadata = {
            "parser_version": context.parser_version,
            "original_filename": context.source_path.name,
            "root_type": type(data).__name__
        }
        
        doc_id = f"doc_{file_hash[:16]}"
        
        return CanonicalDocument(
            doc_id=doc_id,
            source_file=str(context.source_path),
            hash=file_hash,
            content_type=context.content_type,
            title=title,
            normalized_content=full_text,
            metadata=canonical_metadata,
            ingested_at=datetime.utcnow()
        )
