import hashlib
import pandas as pd
from typing import ClassVar, List
from datetime import datetime
from pathlib import Path

from src.ingestion.parsers.base import DocumentParser
from src.ingestion.models.context import IngestionContext
from src.organization_memory.models import CanonicalDocument
from src.shared.logging import ingestion_logger

class CsvParser(DocumentParser):
    SUPPORTED_TYPES: ClassVar[List[str]] = ["text/csv"]
    
    def supports(self, content_type: str) -> bool:
        return content_type.lower() in self.SUPPORTED_TYPES
        
    def _generate_hash(self, file_path: Path) -> str:
        h = hashlib.sha256()
        with open(file_path, "rb") as f:
            while chunk := f.read(65536):
                h.update(chunk)
        return h.hexdigest()
        
    def parse(self, context: IngestionContext) -> CanonicalDocument:
        ingestion_logger.info(f"CsvParser processing {context.source_path}")
        
        file_hash = self._generate_hash(context.source_path)
        
        metadata = {
            "parser_version": context.parser_version,
            "original_filename": context.source_path.name
        }
        
        try:
            df = pd.read_csv(context.source_path)
            # Convert CSV to a markdown table format for best LLM consumption
            full_text = df.to_markdown(index=False)
            metadata["rows"] = len(df)
            metadata["columns"] = list(df.columns)
        except Exception as e:
            ingestion_logger.error(f"Failed to parse CSV {context.source_path}: {e}")
            full_text = f"ERROR: Failed to parse CSV - {e}"
            
        title = context.source_path.stem
        doc_id = f"doc_{file_hash[:16]}"
        
        return CanonicalDocument(
            doc_id=doc_id,
            source_file=str(context.source_path),
            hash=file_hash,
            content_type=context.content_type,
            title=title,
            normalized_content=full_text,
            metadata=metadata,
            ingested_at=datetime.utcnow()
        )
