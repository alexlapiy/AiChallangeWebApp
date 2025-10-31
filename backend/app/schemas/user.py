from pydantic import BaseModel

from app.schemas.base import TimestampedDto


class UserCreate(BaseModel):
    full_name: str
    phone: str


class UserDto(TimestampedDto):
    full_name: str
    phone: str


