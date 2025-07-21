"""add program studi table

Revision ID: add_program_studi_table
Revises: update_nilai_column
Create Date: 2025-07-20 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_program_studi_table'
down_revision = 'update_nilai_column'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('program_studi',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('program_studi', sa.String(), nullable=False),
        sa.Column('jenjang', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_program_studi_id'), 'program_studi', ['id'], unique=False)


def downgrade():
    op.drop_index(op.f('ix_program_studi_id'), table_name='program_studi')
    op.drop_table('program_studi') 