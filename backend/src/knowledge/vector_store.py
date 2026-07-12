from sqlalchemy import Column, String, Integer, Text
from sqlalchemy.orm import declarative_base
from pgvector.sqlalchemy import Vector

from src.shared.config import settings

Base = declarative_base()

class DocumentChunkEmbedding(Base):
    __tablename__ = "document_chunks"
    
    # Primary Key
    chunk_id = Column(String, primary_key=True)
    
    # Canonical Document Link
    doc_id = Column(String, index=True, nullable=False)
    tenant_id = Column(String, index=True, nullable=False)
    
    # Text Payload
    text = Column(Text, nullable=False)
    semantic_context = Column(Text, nullable=True)
    
    # Embeddings using pgvector
    # Use embedding dimension from settings (384 for all-MiniLM-L6-v2)
    embedding = Column(Vector(settings.EMBEDDING_DIM), nullable=False)
