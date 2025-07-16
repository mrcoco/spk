"""update nilai column length

Revision ID: update_nilai_column
Revises: 
Create Date: 2024-03-19 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'update_nilai_column'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Mengubah tipe kolom nilai dari VARCHAR(1) menjadi VARCHAR(2)
    op.alter_column('nilai', 'nilai',
                    existing_type=sa.String(length=1),
                    type_=sa.String(length=2),
                    existing_nullable=False)

def downgrade():
    # Mengembalikan tipe kolom nilai dari VARCHAR(2) menjadi VARCHAR(1)
    op.alter_column('nilai', 'nilai',
                    existing_type=sa.String(length=2),
                    type_=sa.String(length=1),
                    existing_nullable=False) 