"""add_latitude_longitude_to_cities

Revision ID: d1727ff6f90b
Revises: 349d86ee7060
Create Date: 2025-11-02 22:03:17.737660

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'd1727ff6f90b'
down_revision = '349d86ee7060'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('cities', sa.Column('latitude', sa.Float(), nullable=True))
    op.add_column('cities', sa.Column('longitude', sa.Float(), nullable=True))


def downgrade() -> None:
    op.drop_column('cities', 'longitude')
    op.drop_column('cities', 'latitude')


