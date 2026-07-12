"""init_pgvector

Revision ID: f472e207f1a7
Revises: 
Create Date: 2026-07-12 15:10:50.140572

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import pgvector.sqlalchemy

# revision identifiers, used by Alembic.
revision: str = 'f472e207f1a7'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Enable pgvector
    op.execute('CREATE EXTENSION IF NOT EXISTS vector;')

    op.create_table('document_chunks',
    sa.Column('chunk_id', sa.String(), nullable=False),
    sa.Column('doc_id', sa.String(), nullable=False),
    sa.Column('tenant_id', sa.String(), nullable=False),
    sa.Column('text', sa.Text(), nullable=False),
    sa.Column('semantic_context', sa.Text(), nullable=True),
    sa.Column('embedding', pgvector.sqlalchemy.vector.VECTOR(dim=384), nullable=False),
    sa.PrimaryKeyConstraint('chunk_id')
    )
    op.create_index(op.f('ix_document_chunks_doc_id'), 'document_chunks', ['doc_id'], unique=False)
    op.create_index(op.f('ix_document_chunks_tenant_id'), 'document_chunks', ['tenant_id'], unique=False)

    # Create HNSW cosine index
    op.execute(
        """
        CREATE INDEX ON document_chunks 
        USING hnsw (embedding vector_cosine_ops)
        WITH (m = 16, ef_construction = 64);
        """
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_document_chunks_tenant_id'), table_name='document_chunks')
    op.drop_index(op.f('ix_document_chunks_doc_id'), table_name='document_chunks')
    op.drop_table('document_chunks')
    
    # We leave the vector extension as it might be used by other features
    # op.execute('DROP EXTENSION IF EXISTS vector;')
