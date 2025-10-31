from pydantic import BaseModel, Field

from app.schemas.base import TimestampedDto


class TariffCreate(BaseModel):
    month: int = Field(ge=1, le=12)
    price_per_km_le_1000: int = Field(ge=0)
    price_per_km_gt_1000: int = Field(ge=0)


class TariffUpdate(BaseModel):
    month: int | None = Field(default=None, ge=1, le=12)
    price_per_km_le_1000: int | None = Field(default=None, ge=0)
    price_per_km_gt_1000: int | None = Field(default=None, ge=0)


class TariffDto(TimestampedDto):
    month: int
    price_per_km_le_1000: int
    price_per_km_gt_1000: int


