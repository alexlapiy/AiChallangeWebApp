from datetime import date

from pydantic import BaseModel

from app.repositories.models import PaymentStatus
from app.schemas.base import TimestampedDto


class OrderPreviewRequest(BaseModel):
    user_id: int | None = None
    full_name: str | None = None
    phone: str | None = None
    car_brand_model: str
    from_city: str
    to_city: str
    start_date: date


class OrderPreviewResponse(BaseModel):
    distance_km: int
    is_fixed_route: bool
    applied_price_per_km: int | None
    transport_price: int
    insurance_price: int
    duration_hours: int
    eta_date: date


class OrderCreate(BaseModel):
    user_id: int
    car_brand_model: str
    from_city_id: int
    to_city_id: int
    from_city: str
    to_city: str
    start_date: date


class OrderDto(TimestampedDto):
    user_id: int
    car_brand_model: str
    from_city_id: int
    to_city_id: int
    start_date: date
    distance_km: int
    applied_price_per_km: int | None
    is_fixed_route: bool
    transport_price: int
    insurance_price: int
    duration_hours: int
    eta_date: date
    payment_status: PaymentStatus


