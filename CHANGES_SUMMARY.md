# Сводка изменений: Гибридная система расчета расстояний

## Проблема
При добавлении нового города через админ-панель невозможно рассчитать расстояния до других городов, т.к. они жестко зашиты в `offline_matrix.json`.

## Решение
Гибридный подход: **БД + OSRM API**

### Как работает
1. **Сначала ищет в БД** — быстро, надежно
2. **Если нет — запрашивает OSRM** — бесплатный API автомобильных маршрутов
3. **Автоматически кеширует** результат в БД для будущих запросов

## Что изменено

### Backend

#### Модели
- `City`: добавлены `latitude`, `longitude`
- `CityDistance`: новая таблица для хранения расстояний

#### Провайдеры
- `OSRMProvider`: запросы к OSRM API
- `HybridDistanceProvider`: БД → OSRM → кеш

#### API (новые endpoints)
- `GET /api/v1/city-distances` — список расстояний
- `POST /api/v1/city-distances` — добавить вручную (админ)
- `PUT /api/v1/city-distances/{id}` — обновить
- `DELETE /api/v1/city-distances/{id}` — удалить

#### Миграции
- `d1727ff6f90b_add_latitude_longitude_to_cities.py`
- `e8e918e79aac_add_city_distances_table.py`

#### Seed
Автоматически мигрирует данные из `offline_matrix.json` в БД при старте.

### Файлы

**Созданы:**
- `backend/app/repositories/city_distance_repo.py`
- `backend/app/schemas/city_distance.py`
- `backend/app/api/v1/city_distances.py`
- `backend/alembic/versions/d1727ff6f90b_add_latitude_longitude_to_cities.py`
- `backend/alembic/versions/e8e918e79aac_add_city_distances_table.py`

**Изменены:**
- `backend/app/repositories/models.py` — добавлены City.latitude/longitude, CityDistance
- `backend/app/infra/distance/provider.py` — OSRMProvider, HybridDistanceProvider
- `backend/app/schemas/city.py` — latitude, longitude
- `backend/app/api/v1/cities.py` — поддержка координат
- `backend/app/api/v1/orders.py` — использует HybridDistanceProvider
- `backend/app/api/v1/__init__.py` — подключен роутер city_distances
- `backend/app/infra/seed.py` — миграция offline_matrix.json
- `backend/requirements.txt` — добавлен httpx

## Быстрый старт

```bash
# 1. Установить httpx
cd backend && source venv/bin/activate && pip install "httpx>=0.27"

# 2. Запустить БД
docker-compose up -d db

# 3. Применить миграции
cd backend && alembic upgrade head

# 4. Перезапустить backend
docker-compose restart backend
```

## Использование

### Добавить новый город с координатами
```json
POST /api/v1/cities
{
  "name": "Казань",
  "is_active": true,
  "latitude": 55.8304,
  "longitude": 49.0661
}
```

### Создать заказ для нового маршрута
```json
POST /api/v1/orders/preview
{
  "from_city": "Москва",
  "to_city": "Казань",
  "start_date": "2025-11-10"
}
```

При первом запросе:
1. HybridDistanceProvider не найдет расстояние в БД
2. Запросит OSRM API (используя координаты)
3. Сохранит результат в `city_distances`
4. Вернет расчет

При повторных запросах — сразу из БД.

### Вручную добавить расстояние (админ)
```json
POST /api/v1/city-distances
{
  "from_city_id": 1,
  "to_city_id": 5,
  "distance_km": 800,
  "is_manual": true
}
```

## Координаты городов

Для получения координат можно использовать:
- Google Maps (ПКМ → "Что здесь?")
- OpenStreetMap Nominatim API
- Вручную ввести в админ-панели

## Frontend TODO

Для админ-панели:
1. Обновить форму создания/редактирования города — добавить поля latitude, longitude
2. Создать страницу "Расстояния между городами" с CRUD операциями
3. Показывать предупреждение, если у города нет координат

## Детали

См. полную документацию: `HYBRID_DISTANCE_IMPLEMENTATION.md`

