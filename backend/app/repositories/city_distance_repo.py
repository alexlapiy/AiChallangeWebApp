from typing import Optional

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.repositories.models import CityDistance


class CityDistanceRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def listAll(self) -> list[CityDistance]:
        return list(self.session.query(CityDistance).all())

    def find(self, from_city_id: int, to_city_id: int) -> Optional[CityDistance]:
        """Ищет расстояние между городами (в обе стороны)"""
        return self.session.query(CityDistance).filter(
            or_(
                (CityDistance.from_city_id == from_city_id) & (CityDistance.to_city_id == to_city_id),
                (CityDistance.from_city_id == to_city_id) & (CityDistance.to_city_id == from_city_id)
            )
        ).first()

    def create(self, from_city_id: int, to_city_id: int, distance_km: int, is_manual: bool = True) -> CityDistance:
        obj = CityDistance(
            from_city_id=from_city_id,
            to_city_id=to_city_id,
            distance_km=distance_km,
            is_manual=is_manual
        )
        self.session.add(obj)
        self.session.flush()
        return obj

    def delete(self, distance_id: int) -> None:
        obj = self.session.get(CityDistance, distance_id)
        if obj:
            self.session.delete(obj)
            self.session.flush()

