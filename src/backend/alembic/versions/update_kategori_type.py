"""update kategori type

Revision ID: update_kategori_type
Revises: 
Create Date: 2024-03-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'update_kategori_type'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Hapus constraint enum terlebih dahulu
    op.execute('ALTER TABLE klasifikasi_kelulusan ALTER COLUMN kategori TYPE varchar(50)')

def downgrade():
    # Buat kembali tipe enum dan constraint
    op.execute("""
        CREATE TYPE kategoripeluang AS ENUM (
            'Peluang Lulus Tinggi',
            'Peluang Lulus Sedang',
            'Peluang Lulus Kecil'
        )
    """)
    op.execute('ALTER TABLE klasifikasi_kelulusan ALTER COLUMN kategori TYPE kategoripeluang USING kategori::kategoripeluang') 