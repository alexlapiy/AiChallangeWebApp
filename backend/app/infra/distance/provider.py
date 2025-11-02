import json
import os
from functools import lru_cache
from typing import Optional

import httpx
from sqlalchemy.orm import Session

from app.repositories.models import City, CityDistance


class DistanceProvider:
    def getDistanceKm(self, from_city: str, to_city: str) -> int:  # pragma: no cover
        raise NotImplementedError


class OfflineMatrixProvider(DistanceProvider):
    def __init__(self, matrix_path: str | None = None) -> None:
        self.matrix_path = matrix_path or os.path.join(
            os.path.dirname(__file__), "offline_matrix.json"
        )

    @lru_cache(maxsize=1)
    def _load(self) -> dict:
        with open(self.matrix_path, "r", encoding="utf-8") as f:
            return json.load(f)

    def getDistanceKm(self, from_city: str, to_city: str) -> int:
        data = self._load()
        frm = data.get(from_city)
        if frm and to_city in frm:
            return int(frm[to_city])
        # Try symmetric
        rev = data.get(to_city)
        if rev and from_city in rev:
            return int(rev[from_city])
        raise ValueError(f"Distance not found for {from_city} -> {to_city}")


class OSRMProvider(DistanceProvider):
    """Использует публичный OSRM API для расчета автомобильных расстояний"""

    def __init__(self, base_url: str = "http://router.project-osrm.org") -> None:
        self.base_url = base_url

    def getDistanceKm(self, from_city: str, to_city: str, from_coords: tuple[float, float], to_coords: tuple[float, float]) -> int:
        """
        Получает расстояние между двумя точками через OSRM API
        :param from_coords: (latitude, longitude)
        :param to_coords: (latitude, longitude)
        """
        lon1, lat1 = from_coords[1], from_coords[0]
        lon2, lat2 = to_coords[1], to_coords[0]

        url = f"{self.base_url}/route/v1/driving/{lon1},{lat1};{lon2},{lat2}"
        params = {"overview": "false"}

        try:
            with httpx.Client(timeout=10.0) as client:
                resp = client.get(url, params=params)
                resp.raise_for_status()
                data = resp.json()

                if data.get("code") != "Ok" or not data.get("routes"):
                    raise ValueError(f"OSRM API error: {data.get('message', 'No route found')}")

                meters = data["routes"][0]["distance"]
                return int(meters / 1000)
        except httpx.HTTPError as e:
            raise ValueError(f"Failed to fetch distance from OSRM: {e}")


class HybridDistanceProvider(DistanceProvider):
    """
    Сначала ищет расстояние в БД, если не найдено — запрашивает через OSRM и кеширует в БД
    """

    def __init__(self, session: Session, osrm_provider: Optional[OSRMProvider] = None) -> None:
        self.session = session
        self.osrm = osrm_provider or OSRMProvider()

    def getDistanceKm(self, from_city: str, to_city: str) -> int:
        # 1. Получить города из БД
        city_from = self.session.query(City).filter_by(name=from_city).first()
        city_to = self.session.query(City).filter_by(name=to_city).first()

        if not city_from or not city_to:
            raise ValueError(f"City not found: {from_city} or {to_city}")

        # 2. Проверить в БД (прямое и обратное направление)
        dist = self.session.query(CityDistance).filter(
            ((CityDistance.from_city_id == city_from.id) & (CityDistance.to_city_id == city_to.id)) |
            ((CityDistance.from_city_id == city_to.id) & (CityDistance.to_city_id == city_from.id))
        ).first()

        if dist:
            return dist.distance_km

        # 3. Проверить наличие координат для OSRM
        if not (city_from.latitude and city_from.longitude and city_to.latitude and city_to.longitude):
            raise ValueError(
                f"No distance in DB and missing coordinates for OSRM: {from_city} "
                f"({city_from.latitude}, {city_from.longitude}) -> {to_city} ({city_to.latitude}, {city_to.longitude})"
            )

        # 4. Запросить через OSRM
        distance_km = self.osrm.getDistanceKm(
            from_city,
            to_city,
            (city_from.latitude, city_from.longitude),
            (city_to.latitude, city_to.longitude),
        )

        # 5. Сохранить в БД для будущих запросов
        new_dist = CityDistance(
            from_city_id=city_from.id,
            to_city_id=city_to.id,
            distance_km=distance_km,
            is_manual=False,
        )
        self.session.add(new_dist)
        self.session.flush()

        return distance_km


