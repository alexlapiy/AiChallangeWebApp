from typing import Optional

from pydantic import BaseModel, ConfigDict


class CityDistanceDto(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    from_city_id: int
    to_city_id: int
    distance_km: int
    is_manual: bool


class CityDistanceCreate(BaseModel):
    from_city_id: int
    to_city_id: int
    distance_km: int
    is_manual: bool = True


class CityDistanceUpdate(BaseModel):
    distance_km: Optional[int] = None
    is_manual: Optional[bool] = None

