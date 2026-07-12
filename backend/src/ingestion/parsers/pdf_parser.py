import hashlib
from typing import ClassVar, List
import pdfplumber
from datetime import datetime
from pathlib import Path

from src.ingestion.parsers.base import DocumentParser
from src.ingestion.models.context import IngestionContext
from src.organization_memory.models import CanonicalDocument
from src.shared.logging import ingestion_logger

class PdfParser(DocumentParser):
    SUPPORTED_TYPES: ClassVar[List[str]] = ["application/pdf"]
    
    def supports(self, content_type: str) -> bool:
        return content_type.lower() in self.SUPPORTED_TYPES
        
    def _generate_hash(self, file_path: Path) -> str:
        h = hashlib.sha256()
        with open(file_path, "rb") as f:
            while chunk := f.read(65536):
                h.update(chunk)
        return h.hexdigest()
        
    def parse(self, context: IngestionContext) -> CanonicalDocument:
        ingestion_logger.info(f"PdfParser processing {context.source_path}")
        
        # 1. Generate deterministic file hash
        file_hash = self._generate_hash(context.source_path)
        
        # 2. Extract text and basic metadata using pdfplumber
        text_content = []
        pdf_metadata = {}
        
        try:
            with pdfplumber.open(context.source_path) as pdf:
                pdf_metadata = pdf.metadata or {}
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text_content.append(page_text)
        except Exception as e:
            ingestion_logger.error(f"Failed to parse PDF {context.source_path}: {e}")
            text_content = [f"ERROR: Failed to parse PDF - {e}"]
            
        full_text = "\n\n".join(text_content).strip()
        if not full_text:
            full_text = "EMPTY_PDF"
            
        # Try to resolve a title
        title = pdf_metadata.get("Title") or context.source_path.stem
        
        # Build canonical metadata
        canonical_metadata = {
            "parser_version": context.parser_version,
            "page_count": pdf_metadata.get("Pages", len(text_content)),
            "author": pdf_metadata.get("Author", "Unknown"),
            "creation_date": pdf_metadata.get("CreationDate", ""),
            "original_filename": context.source_path.name
        }
        
        # We need a stable ID for the document.
        # file_hash is a great deterministic doc_id.
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
