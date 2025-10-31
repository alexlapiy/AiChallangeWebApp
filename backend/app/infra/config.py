import os
from pydantic import BaseModel


class Settings(BaseModel):
    database_url: str = os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg://postgres:postgres@db:5432/shipment",
    )
    api_debug: bool = os.getenv("API_DEBUG", "false").lower() == "true"


def getSettings() -> Settings:
    return Settings()


