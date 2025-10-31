from pydantic import BaseModel


class FixedRouteDto(BaseModel):
    from_city: str
    to_city: str
    fixed_price: int


