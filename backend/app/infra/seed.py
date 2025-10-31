from sqlalchemy import select
from sqlalchemy.orm import Session

from app.infra.db import Base, engine
from app.repositories.models import City, FixedRoute, Tariff, Admin
from app.infra.security import hashPassword


def runBootstrap(session: Session) -> None:
    # Create tables in dev bootstrap (Alembic is recommended for production)
    Base.metadata.create_all(bind=engine)

    # Cities
    existing_cities = {c.name for c in session.execute(select(City)).scalars().all()}
    for name in ["Москва", "Сочи", "Санкт-Петербург", "Бишкек"]:
        if name not in existing_cities:
            session.add(City(name=name, is_active=True))

    # Fixed routes
    existing_fr = {(fr.from_city, fr.to_city) for fr in session.execute(select(FixedRoute)).scalars().all()}
    for fr in [
        ("Москва", "Сочи", 200_000),
        ("Сочи", "Москва", 200_000),
        ("Бишкек", "Москва", 350_000),
    ]:
        key = (fr[0], fr[1])
        if key not in existing_fr:
            session.add(FixedRoute(from_city=fr[0], to_city=fr[1], fixed_price=fr[2]))

    # Tariffs for months (defaults: 150 and 100)
    months = {t.month for t in session.execute(select(Tariff)).scalars().all()}
    for m in range(1, 13):
        if m not in months:
            session.add(Tariff(month=m, price_per_km_le_1000=150, price_per_km_gt_1000=100))

    # Default admin
    existing_admin = session.execute(select(Admin)).scalars().first()
    if existing_admin is None:
        session.add(Admin(login="admin", password_hash=hashPassword("admin")))


