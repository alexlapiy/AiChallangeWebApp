from pydantic import BaseModel

from app.schemas.base import TimestampedDto


class CityCreate(BaseModel):
    name: str
    is_active: bool = True


class CityUpdate(BaseModel):
    name: str | None = None
    is_active: bool | None = None


class CityDto(TimestampedDto):
    name: str
    is_active: bool


