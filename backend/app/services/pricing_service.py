from dataclasses import dataclass
from datetime import date, timedelta

from sqlalchemy.orm import Session

from app.infra.distance.provider import DistanceProvider
from app.repositories.fixed_route_repo import FixedRouteRepository
from app.repositories.models import Order, PaymentStatus
from app.repositories.order_repo import OrderRepository
from app.repositories.tariff_repo import TariffRepository


@dataclass
class PricingResult:
    distance_km: int
    is_fixed_route: bool
    applied_price_per_km: int | None
    transport_price: int
    insurance_price: int
    duration_hours: int
    eta_date: date


class PricingService:
    def __init__(self, session: Session, distance_provider: DistanceProvider) -> None:
        self.session = session
        self.distance_provider = distance_provider
        self.fixed_repo = FixedRouteRepository(session)
        self.tariff_repo = TariffRepository(session)
        self.order_repo = OrderRepository(session)

    def preview(self, start_date: date, from_city: str, to_city: str) -> PricingResult:
        distance_km = self.distance_provider.getDistanceKm(from_city, to_city)

        fixed = self.fixed_repo.find(from_city, to_city)
        if fixed is not None:
            transport_price = int(fixed.fixed_price)
            is_fixed_route = True
            applied_price_per_km = None
        else:
            tariff = self.tariff_repo.getForDate(start_date)
            if tariff is None:
                raise ValueError("Tariff for the selected month not found")
            is_fixed_route = False
            if distance_km <= 1000:
                applied_price_per_km = int(tariff.price_per_km_le_1000)
            else:
                applied_price_per_km = int(tariff.price_per_km_gt_1000)
            transport_price = int(applied_price_per_km * distance_km)

        insurance_price = int(round(transport_price * 0.10))
        duration_hours_float = distance_km * 24 / 1000
        duration_hours = int(round(duration_hours_float))
        eta_date = start_date + timedelta(hours=duration_hours)

        return PricingResult(
            distance_km=distance_km,
            is_fixed_route=is_fixed_route,
            applied_price_per_km=applied_price_per_km,
            transport_price=transport_price,
            insurance_price=insurance_price,
            duration_hours=duration_hours,
            eta_date=eta_date,
        )

    def createOrder(
        self,
        user_id: int,
        car_brand_model: str,
        start_date: date,
        from_city_id: int,
        to_city_id: int,
        from_city_name: str,
        to_city_name: str,
    ) -> Order:
        pr = self.preview(start_date, from_city_name, to_city_name)

        order = Order(
            user_id=user_id,
            car_brand_model=car_brand_model,
            from_city_id=from_city_id,
            to_city_id=to_city_id,
            start_date=start_date,
            distance_km=pr.distance_km,
            applied_price_per_km=pr.applied_price_per_km,
            is_fixed_route=pr.is_fixed_route,
            transport_price=pr.transport_price,
            insurance_price=pr.insurance_price,
            duration_hours=pr.duration_hours,
            eta_date=pr.eta_date,
            payment_status=PaymentStatus.PENDING,
        )
        self.order_repo.add(order)
        return order


