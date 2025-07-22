"""Add status_lulus_aktual and tanggal_lulus to mahasiswa table

Revision ID: add_status_lulus_aktual
Revises: d6825691d7a1
Create Date: 2024-01-20 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_status_lulus_aktual'
down_revision = 'd6825691d7a1'
branch_labels = None
depends_on = None

def upgrade():
    # Add status_lulus_aktual column
    op.add_column('mahasiswa', sa.Column('status_lulus_aktual', sa.String(20), nullable=True))
    
    # Add tanggal_lulus column
    op.add_column('mahasiswa', sa.Column('tanggal_lulus', sa.DateTime(), nullable=True))
    
    # Add index for better performance
    op.create_index('idx_mahasiswa_status_lulus', 'mahasiswa', ['status_lulus_aktual'])

def downgrade():
    # Remove index
    op.drop_index('idx_mahasiswa_status_lulus', table_name='mahasiswa')
    
    # Remove columns
    op.drop_column('mahasiswa', 'tanggal_lulus')
    op.drop_column('mahasiswa', 'status_lulus_aktual') 