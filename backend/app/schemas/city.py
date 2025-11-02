from typing import Optional

from pydantic import BaseModel

from app.schemas.base import TimestampedDto


class CityCreate(BaseModel):
    name: str
    is_active: bool = True
    latitude: float
    longitude: float


class CityUpdate(BaseModel):
    name: str | None = None
    is_active: bool | None = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class CityDto(TimestampedDto):
    name: str
    is_active: bool
    latitude: Optional[float]
    longitude: Optional[float]


