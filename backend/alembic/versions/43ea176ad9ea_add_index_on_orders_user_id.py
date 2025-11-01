"""add_index_on_orders_user_id

Revision ID: 43ea176ad9ea
Revises: 0001_initial
Create Date: 2025-11-01 22:43:14.695632

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '43ea176ad9ea'
down_revision = '0001_initial'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_index('ix_orders_user_id', 'orders', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_orders_user_id', table_name='orders')


