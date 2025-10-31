from datetime import date

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.infra.db import Base
from app.infra.distance.provider import OfflineMatrixProvider
from app.repositories.models import FixedRoute, Tariff
from app.services.pricing_service import PricingService


def make_session():
    engine = create_engine("sqlite+pysqlite:///:memory:", future=True)
    TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
    Base.metadata.create_all(bind=engine)
    return TestingSessionLocal()


def seed(session):
    session.add(Tariff(month=1, price_per_km_le_1000=150, price_per_km_gt_1000=100))
    session.add(FixedRoute(from_city="Москва", to_city="Сочи", fixed_price=200_000))
    session.commit()


def test_fixed_route_price():
    s = make_session()
    seed(s)
    svc = PricingService(s, OfflineMatrixProvider())
    res = svc.preview(date(2025, 1, 10), "Москва", "Сочи")
    assert res.is_fixed_route is True
    assert res.transport_price == 200_000
    assert res.insurance_price == int(200_000 * 0.10)


def test_variable_tariff_pricing_and_eta():
    s = make_session()
    seed(s)
    svc = PricingService(s, OfflineMatrixProvider())
    # SPB-Moscow 700km -> 150/km
    res = svc.preview(date(2025, 1, 5), "Санкт-Петербург", "Москва")
    assert res.is_fixed_route is False
    assert res.applied_price_per_km == 150
    assert res.transport_price == 150 * 700
    # duration: 700 * 24 / 1000 = 16.8 -> round to 17 hours
    assert res.duration_hours == 17


