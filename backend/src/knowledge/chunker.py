from typing import List
from langchain_text_splitters import RecursiveCharacterTextSplitter

from src.organization_memory.models import CanonicalDocument, CanonicalChunk
from src.shared.config import settings

class DocumentChunker:
    """
    Chunks a CanonicalDocument into smaller CanonicalChunks suitable for vector embedding.
    """
    
    def __init__(self, chunk_size: int = None, chunk_overlap: int = None):
        self.chunk_size = chunk_size or settings.CHUNK_SIZE
        self.chunk_overlap = chunk_overlap or settings.CHUNK_OVERLAP
        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.chunk_size,
            chunk_overlap=self.chunk_overlap,
            separators=["\n\n", "\n", " ", ""]
        )
        
    def chunk(self, doc: CanonicalDocument) -> List[CanonicalChunk]:
        """
        Splits the document text and maps it into CanonicalChunk models.
        """
        if not doc.normalized_content:
            return []
            
        texts = self.splitter.split_text(doc.normalized_content)
        chunks = []
        
        current_idx = 0
        for i, text in enumerate(texts):
            # Calculate rough character index positioning for basic traceability
            start_idx = doc.normalized_content.find(text, current_idx)
            if start_idx == -1:
                start_idx = current_idx
            end_idx = start_idx + len(text)
            current_idx = start_idx + (len(text) // 2)
            
            chunk = CanonicalChunk(
                chunk_id=f"{doc.doc_id}_chunk_{i}",
                doc_id=doc.doc_id,
                text=text,
                start_char_idx=start_idx,
                end_char_idx=end_idx,
                semantic_context=doc.title,
                tokens=len(text.split())  # naive approximation
            )
            chunks.append(chunk)
            
        return chunks
