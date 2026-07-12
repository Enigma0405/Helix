from typing import List
from sentence_transformers import SentenceTransformer

from src.shared.config import settings
from src.shared.logging import knowledge_logger

class EmbeddingService:
    """
    Wraps sentence-transformers to generate deterministic vectors for text chunks.
    """
    
    def __init__(self, model_name: str = None):
        self.model_name = model_name or settings.EMBEDDING_MODEL_LOCAL
        knowledge_logger.info(f"Initializing EmbeddingService with {self.model_name}")
        self.model = SentenceTransformer(self.model_name)
        
    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        """
        Embeds a list of strings into a list of vectors.
        """
        if not texts:
            return []
            
        embeddings = self.model.encode(texts, show_progress_bar=False)
        return embeddings.tolist()
        
    def embed_text(self, text: str) -> List[float]:
        """
        Embeds a single string into a vector.
        """
        return self.embed_texts([text])[0]
