"""add_city_distances_table

Revision ID: e8e918e79aac
Revises: d1727ff6f90b
Create Date: 2025-11-02 22:03:29.753121

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'e8e918e79aac'
down_revision = 'd1727ff6f90b'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'city_distances',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('from_city_id', sa.Integer(), nullable=False),
        sa.Column('to_city_id', sa.Integer(), nullable=False),
        sa.Column('distance_km', sa.Integer(), nullable=False),
        sa.Column('is_manual', sa.Boolean(), nullable=False, server_default='false'),
        sa.ForeignKeyConstraint(['from_city_id'], ['cities.id'], ),
        sa.ForeignKeyConstraint(['to_city_id'], ['cities.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('from_city_id', 'to_city_id', name='uq_city_pair')
    )
    op.create_index('ix_city_distances_pair', 'city_distances', ['from_city_id', 'to_city_id'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_city_distances_pair', table_name='city_distances')
    op.drop_table('city_distances')


