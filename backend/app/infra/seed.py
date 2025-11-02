import json
import os
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.infra.db import Base, engine
from app.repositories.models import City, FixedRoute, Tariff, Admin, CityDistance
from app.infra.security import hashPassword


def runBootstrap(session: Session) -> None:
    # Create tables in dev bootstrap (Alembic is recommended for production)
    Base.metadata.create_all(bind=engine)

    # Cities with coordinates
    city_coords = {
        "Москва": (55.7558, 37.6173),
        "Сочи": (43.6028, 39.7342),
        "Санкт-Петербург": (59.9343, 30.3351),
        "Бишкек": (42.8746, 74.5698),
    }
    
    existing_cities_map = {c.name: c for c in session.execute(select(City)).scalars().all()}
    for name, (lat, lon) in city_coords.items():
        if name not in existing_cities_map:
            session.add(City(name=name, is_active=True, latitude=lat, longitude=lon))
        else:
            # Обновить координаты для существующих городов, если не установлены
            city = existing_cities_map[name]
            if city.latitude is None or city.longitude is None:
                city.latitude = lat
                city.longitude = lon
                session.add(city)
    
    session.flush()  # Чтобы получить ID городов

    # Fixed routes
    existing_fr = {(fr.from_city, fr.to_city) for fr in session.execute(select(FixedRoute)).scalars().all()}
    for fr in [
        ("Москва", "Сочи", 200_000),
        ("Сочи", "Москва", 200_000),
        ("Москва", "Бишкек", 350_000),
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
        session.add(Admin(login="admin", password_hash=hashPassword("admin123")))
    
    # Migrate offline_matrix.json to city_distances table
    _migrateOfflineMatrix(session)


def _migrateOfflineMatrix(session: Session) -> None:
    """Мигрирует данные из offline_matrix.json в таблицу city_distances"""
    matrix_path = os.path.join(os.path.dirname(__file__), "distance", "offline_matrix.json")
    
    if not os.path.exists(matrix_path):
        return  # Файл не найден — пропускаем
    
    with open(matrix_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    # Получить все города в map для быстрого поиска по имени
    cities_map = {c.name: c for c in session.execute(select(City)).scalars().all()}
    
    # Получить существующие расстояния, чтобы не дублировать
    existing_distances = set()
    for dist in session.execute(select(CityDistance)).scalars().all():
        pair1 = (dist.from_city_id, dist.to_city_id)
        pair2 = (dist.to_city_id, dist.from_city_id)
        existing_distances.add(pair1)
        existing_distances.add(pair2)
    
    # Добавить расстояния из offline_matrix.json
    for from_city_name, routes in data.items():
        if from_city_name not in cities_map:
            continue
        
        from_city = cities_map[from_city_name]
        
        for to_city_name, distance_km in routes.items():
            if to_city_name not in cities_map:
                continue
            
            to_city = cities_map[to_city_name]
            
            # Проверить, не существует ли уже
            pair = (from_city.id, to_city.id)
            if pair in existing_distances:
                continue
            
            # Добавить расстояние
            session.add(CityDistance(
                from_city_id=from_city.id,
                to_city_id=to_city.id,
                distance_km=int(distance_km),
                is_manual=True  # Помечаем как ручное, т.к. из исходного файла
            ))
            
            # Добавить в existing, чтобы не создавать обратное направление дважды
            existing_distances.add(pair)
            existing_distances.add((to_city.id, from_city.id))


