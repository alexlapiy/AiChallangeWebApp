from datetime import date, datetime
from enum import Enum
from typing import Optional

from sqlalchemy import (
    String,
    Integer,
    Boolean,
    ForeignKey,
    Date,
    Index,
    Enum as SAEnum,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infra.db import Base


class PaymentStatus(str, Enum):
    PENDING = "PENDING"
    PAID = "PAID"
    MANUAL = "MANUAL"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    full_name: Mapped[str] = mapped_column(String(200))
    phone: Mapped[str] = mapped_column(String(32))

    orders: Mapped[list["Order"]] = relationship(back_populates="user")


class City(Base):
    __tablename__ = "cities"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(120), unique=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class Tariff(Base):
    __tablename__ = "tariffs"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    month: Mapped[int] = mapped_column(Integer)  # 1..12
    price_per_km_le_1000: Mapped[int] = mapped_column(Integer)  # RUB per km
    price_per_km_gt_1000: Mapped[int] = mapped_column(Integer)  # RUB per km


class FixedRoute(Base):
    __tablename__ = "fixed_routes"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    from_city: Mapped[str] = mapped_column(String(120))
    to_city: Mapped[str] = mapped_column(String(120))
    fixed_price: Mapped[int] = mapped_column(Integer)


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    car_brand_model: Mapped[str] = mapped_column(String(120))
    from_city_id: Mapped[int] = mapped_column(ForeignKey("cities.id"))
    to_city_id: Mapped[int] = mapped_column(ForeignKey("cities.id"))
    start_date: Mapped[date] = mapped_column(Date)

    distance_km: Mapped[int] = mapped_column(Integer)
    applied_price_per_km: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    is_fixed_route: Mapped[bool] = mapped_column(Boolean, default=False)
    transport_price: Mapped[int] = mapped_column(Integer)
    insurance_price: Mapped[int] = mapped_column(Integer)
    duration_hours: Mapped[int] = mapped_column(Integer)
    eta_date: Mapped[date] = mapped_column(Date)
    payment_status: Mapped[PaymentStatus] = mapped_column(SAEnum(PaymentStatus), default=PaymentStatus.PENDING)

    user: Mapped["User"] = relationship(back_populates="orders")
    from_city: Mapped["City"] = relationship(foreign_keys=[from_city_id])
    to_city: Mapped["City"] = relationship(foreign_keys=[to_city_id])


Index("ix_orders_user_id", Order.user_id)
Index("ix_orders_start_date", Order.start_date)
Index("ix_orders_payment_status", Order.payment_status)
Index("ix_orders_from_to", Order.from_city_id, Order.to_city_id)


class Admin(Base):
    __tablename__ = "admins"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    login: Mapped[str] = mapped_column(String(64), unique=True)
    password_hash: Mapped[str] = mapped_column(String(256))


