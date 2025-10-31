"""initial schema

Revision ID: 0001_initial
Revises: 
Create Date: 2025-10-31

"""
from alembic import op
import sqlalchemy as sa


revision = '0001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # users
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('full_name', sa.String(length=200), nullable=False),
        sa.Column('phone', sa.String(length=32), nullable=False),
    )

    # cities
    op.create_table(
        'cities',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('name', sa.String(length=120), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.UniqueConstraint('name'),
    )

    # tariffs
    op.create_table(
        'tariffs',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('month', sa.Integer(), nullable=False),
        sa.Column('price_per_km_le_1000', sa.Integer(), nullable=False),
        sa.Column('price_per_km_gt_1000', sa.Integer(), nullable=False),
    )

    # fixed_routes
    op.create_table(
        'fixed_routes',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('from_city', sa.String(length=120), nullable=False),
        sa.Column('to_city', sa.String(length=120), nullable=False),
        sa.Column('fixed_price', sa.Integer(), nullable=False),
    )

    # admins
    op.create_table(
        'admins',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('login', sa.String(length=64), nullable=False),
        sa.Column('password_hash', sa.String(length=256), nullable=False),
        sa.UniqueConstraint('login'),
    )

    # orders
    payment_enum = sa.Enum('PENDING', 'PAID', 'MANUAL', name='paymentstatus')
    payment_enum.create(op.get_bind(), checkfirst=True)

    op.create_table(
        'orders',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('car_brand_model', sa.String(length=120), nullable=False),
        sa.Column('from_city_id', sa.Integer(), sa.ForeignKey('cities.id'), nullable=False),
        sa.Column('to_city_id', sa.Integer(), sa.ForeignKey('cities.id'), nullable=False),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('distance_km', sa.Integer(), nullable=False),
        sa.Column('applied_price_per_km', sa.Integer(), nullable=True),
        sa.Column('is_fixed_route', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('transport_price', sa.Integer(), nullable=False),
        sa.Column('insurance_price', sa.Integer(), nullable=False),
        sa.Column('duration_hours', sa.Integer(), nullable=False),
        sa.Column('eta_date', sa.Date(), nullable=False),
        sa.Column('payment_status', payment_enum, nullable=False, server_default='PENDING'),
    )

    op.create_index('ix_orders_start_date', 'orders', ['start_date'])
    op.create_index('ix_orders_payment_status', 'orders', ['payment_status'])
    op.create_index('ix_orders_from_to', 'orders', ['from_city_id', 'to_city_id'])


def downgrade() -> None:
    op.drop_index('ix_orders_from_to', table_name='orders')
    op.drop_index('ix_orders_payment_status', table_name='orders')
    op.drop_index('ix_orders_start_date', table_name='orders')
    op.drop_table('orders')
    op.drop_table('admins')
    op.drop_table('fixed_routes')
    op.drop_table('tariffs')
    op.drop_table('cities')
    op.drop_table('users')
    payment_enum = sa.Enum('PENDING', 'PAID', 'MANUAL', name='paymentstatus')
    payment_enum.drop(op.get_bind(), checkfirst=True)


