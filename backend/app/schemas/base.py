from datetime import datetime
from pydantic import BaseModel, ConfigDict


class TimestampedDto(BaseModel):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


