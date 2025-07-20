"""add fis evaluation table

Revision ID: add_fis_evaluation_table
Revises: d6825691d7a1
Create Date: 2024-07-19 09:15:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_fis_evaluation_table'
down_revision = 'd6825691d7a1'
branch_labels = None
depends_on = None


def upgrade():
    # Create fis_evaluation table
    op.create_table('fis_evaluation',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('evaluation_name', sa.String(length=100), nullable=False),
        sa.Column('test_size', sa.Float(), nullable=False),
        sa.Column('random_state', sa.Integer(), nullable=False),
        sa.Column('accuracy', sa.Float(), nullable=False),
        sa.Column('precision_macro', sa.Float(), nullable=False),
        sa.Column('recall_macro', sa.Float(), nullable=False),
        sa.Column('f1_macro', sa.Float(), nullable=False),
        sa.Column('precision_per_class', postgresql.JSON(astext_type=sa.Text()), nullable=False),
        sa.Column('recall_per_class', postgresql.JSON(astext_type=sa.Text()), nullable=False),
        sa.Column('f1_per_class', postgresql.JSON(astext_type=sa.Text()), nullable=False),
        sa.Column('confusion_matrix', postgresql.JSON(astext_type=sa.Text()), nullable=False),
        sa.Column('total_data', sa.Integer(), nullable=False),
        sa.Column('training_data', sa.Integer(), nullable=False),
        sa.Column('test_data', sa.Integer(), nullable=False),
        sa.Column('execution_time', sa.Float(), nullable=False),
        sa.Column('kategori_mapping', postgresql.JSON(astext_type=sa.Text()), nullable=False),
        sa.Column('evaluation_notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes
    op.create_index('idx_fis_evaluation_created_at', 'fis_evaluation', ['created_at'], unique=False)
    op.create_index('idx_fis_evaluation_accuracy', 'fis_evaluation', ['accuracy'], unique=False)
    op.create_index('idx_fis_evaluation_test_size', 'fis_evaluation', ['test_size'], unique=False)


def downgrade():
    # Drop indexes
    op.drop_index('idx_fis_evaluation_test_size', table_name='fis_evaluation')
    op.drop_index('idx_fis_evaluation_accuracy', table_name='fis_evaluation')
    op.drop_index('idx_fis_evaluation_created_at', table_name='fis_evaluation')
    
    # Drop table
    op.drop_table('fis_evaluation') 