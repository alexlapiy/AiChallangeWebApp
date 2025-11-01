"""add_duration_days_and_hours_remainder

Revision ID: 349d86ee7060
Revises: 43ea176ad9ea
Create Date: 2025-11-01 23:11:31.035994

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '349d86ee7060'
down_revision = '43ea176ad9ea'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('orders', sa.Column('duration_days', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('orders', sa.Column('duration_hours_remainder', sa.Integer(), nullable=False, server_default='0'))
    
    # Пересчитываем duration_days и duration_hours_remainder для существующих заказов
    op.execute("""
        UPDATE orders 
        SET 
            duration_days = duration_hours / 24,
            duration_hours_remainder = duration_hours % 24
    """)


def downgrade() -> None:
    op.drop_column('orders', 'duration_hours_remainder')
    op.drop_column('orders', 'duration_days')


