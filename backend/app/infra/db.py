from datetime import datetime
from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase, Mapped, mapped_column

from app.infra.config import getSettings


class Base(DeclarativeBase):
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, onupdate=datetime.utcnow)


def getEngine():
    settings = getSettings()
    return create_engine(settings.database_url, pool_pre_ping=True, future=True)


engine = getEngine()
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


def getSession() -> Generator:
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


