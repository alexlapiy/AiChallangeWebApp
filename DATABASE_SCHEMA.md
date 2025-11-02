# 📊 Схема базы данных

## Обзор

PostgreSQL база данных с 7 таблицами для управления заказами доставки автомобилей.

---

## Таблицы

### 1. `users` — Пользователи

| Колонка | Тип | Описание |
|---------|-----|----------|
| `id` | INTEGER PRIMARY KEY | Уникальный идентификатор |
| `full_name` | VARCHAR(200) | Полное имя пользователя |
| `phone` | VARCHAR(32) | Номер телефона |

**Связи:**
- `orders` — список заказов пользователя (1:N)

**Индексы:**
- PRIMARY KEY на `id`

---

### 2. `cities` — Города

| Колонка | Тип | Описание |
|---------|-----|----------|
| `id` | INTEGER PRIMARY KEY | Уникальный идентификатор |
| `name` | VARCHAR(120) UNIQUE | Название города |
| `is_active` | BOOLEAN DEFAULT TRUE | Активен ли город |
| `latitude` | FLOAT NULL | Широта (для расчета расстояний) |
| `longitude` | FLOAT NULL | Долгота (для расчета расстояний) |

**Бизнес-правила:**
- Если `latitude`/`longitude` заполнены → используется расчет расстояния по формуле Haversine
- Иначе → используется таблица `city_distances` или offline_matrix.json

**Индексы:**
- PRIMARY KEY на `id`
- UNIQUE на `name`

---

### 3. `tariffs` — Тарифы по месяцам

| Колонка | Тип | Описание |
|---------|-----|----------|
| `id` | INTEGER PRIMARY KEY | Уникальный идентификатор |
| `month` | INTEGER | Месяц (1-12) |
| `price_per_km_le_1000` | INTEGER | Цена за км (≤1000 км), руб |
| `price_per_km_gt_1000` | INTEGER | Цена за км (>1000 км), руб |

**Бизнес-правила:**
- Для каждого месяца должна быть запись (всего 12 записей)
- По умолчанию: 150 руб/км (≤1000 км), 100 руб/км (>1000 км)
- Тариф выбирается по месяцу из поля `start_date` заказа

**Индексы:**
- PRIMARY KEY на `id`

---

### 4. `fixed_routes` — Фикс-маршруты

| Колонка | Тип | Описание |
|---------|-----|----------|
| `id` | INTEGER PRIMARY KEY | Уникальный идентификатор |
| `from_city` | VARCHAR(120) | Город отправления |
| `to_city` | VARCHAR(120) | Город назначения |
| `fixed_price` | INTEGER | Фиксированная цена, руб |

**Бизнес-правила:**
- Если найден фикс-маршрут → используется `fixed_price` (тариф не применяется)
- Иначе → расчет по тарифу `(distance_km * price_per_km)`
- Направление важно: Москва→Сочи и Сочи→Москва — разные записи

**Начальные данные:**
- Москва → Сочи: 200 000 руб
- Сочи → Москва: 200 000 руб
- Москва → Бишкек: 350 000 руб
- Бишкек → Москва: 350 000 руб

**Индексы:**
- PRIMARY KEY на `id`

---

### 5. `city_distances` — Расстояния между городами

| Колонка | Тип | Описание |
|---------|-----|----------|
| `id` | INTEGER PRIMARY KEY | Уникальный идентификатор |
| `from_city_id` | INTEGER FK → cities.id | Город отправления |
| `to_city_id` | INTEGER FK → cities.id | Город назначения |
| `distance_km` | INTEGER | Расстояние в километрах |
| `is_manual` | BOOLEAN DEFAULT FALSE | Ручной ввод (TRUE) или авто (FALSE) |

**Бизнес-правила:**
- Используется как кэш для расстояний
- Админ может добавлять/изменять расстояния вручную (`is_manual=TRUE`)
- Ручные расстояния (`is_manual=TRUE`) имеют приоритет над авто-расчетом
- При наличии координат у городов может авто-рассчитываться по Haversine

**Приоритет расчета расстояния:**
1. Ручное расстояние из `city_distances` (`is_manual=TRUE`)
2. Авто-расстояние из `city_distances` (`is_manual=FALSE`)
3. Offline_matrix.json
4. Расчет по Haversine (если у городов есть координаты)

**Индексы:**
- PRIMARY KEY на `id`
- FOREIGN KEY на `from_city_id`, `to_city_id`

---

### 6. `orders` — Заказы

| Колонка | Тип | Описание |
|---------|-----|----------|
| `id` | INTEGER PRIMARY KEY | Уникальный идентификатор |
| `user_id` | INTEGER FK → users.id | Пользователь |
| `car_brand_model` | VARCHAR(120) | Марка и модель авто |
| `from_city_id` | INTEGER FK → cities.id | Город отправления |
| `to_city_id` | INTEGER FK → cities.id | Город назначения |
| `start_date` | DATE | Дата начала доставки |
| `distance_km` | INTEGER | Расстояние (км) |
| `applied_price_per_km` | INTEGER NULL | Примененная цена за км (NULL для фикс-маршрутов) |
| `is_fixed_route` | BOOLEAN DEFAULT FALSE | Использован ли фикс-маршрут |
| `transport_price` | INTEGER | Стоимость перевозки, руб |
| `insurance_price` | INTEGER | Стоимость страховки (10% от transport_price), руб |
| `duration_hours` | INTEGER | Длительность (часы) |
| `duration_days` | INTEGER | Длительность (дни) |
| `duration_hours_remainder` | INTEGER | Остаток часов после дней |
| `eta_date` | DATE | Дата прибытия (start_date + duration) |
| `payment_status` | ENUM | `PENDING`, `PAID`, `MANUAL` |

**Индексы:**
- PRIMARY KEY на `id`
- INDEX `ix_orders_user_id` на `user_id` — ускорение поиска по пользователю
- INDEX `ix_orders_start_date` на `start_date` — фильтрация по дате
- INDEX `ix_orders_payment_status` на `payment_status` — фильтрация по статусу оплаты
- INDEX `ix_orders_from_to` на `(from_city_id, to_city_id)` — составной индекс для маршрутов

**Бизнес-правила:**

#### 1. Расчет цены:

**Если фикс-маршрут:**
```
transport_price = fixed_route.fixed_price
applied_price_per_km = NULL
is_fixed_route = TRUE
```

**Если тариф:**
```
month = extract(month from start_date)
tariff = tariffs WHERE month = month

if distance_km <= 1000:
    price_per_km = tariff.price_per_km_le_1000
else:
    price_per_km = tariff.price_per_km_gt_1000

transport_price = distance_km * price_per_km
applied_price_per_km = price_per_km
is_fixed_route = FALSE
```

#### 2. Расчет страховки:
```
insurance_price = transport_price * 0.1
```

#### 3. Расчет длительности:

Норматив: **1000 км = 24 часа**

```
duration_hours = round(distance_km * 24 / 1000)
duration_days = duration_hours // 24
duration_hours_remainder = duration_hours % 24

if duration_hours_remainder > 0:
    eta_date = start_date + duration_days + 1 день
else:
    eta_date = start_date + duration_days
```

#### 4. Статус оплаты:
- `PENDING` — ожидает оплаты (по умолчанию при создании заказа)
- `PAID` — оплачен (после нажатия кнопки "Оплатить")
- `MANUAL` — ручная обработка админом

---

### 7. `admins` — Администраторы

| Колонка | Тип | Описание |
|---------|-----|----------|
| `id` | INTEGER PRIMARY KEY | Уникальный идентификатор |
| `login` | VARCHAR(64) UNIQUE | Логин |
| `password_hash` | VARCHAR(256) | Хеш пароля (bcrypt) |

**Бизнес-правила:**
- По умолчанию создается админ: `login=admin`, `password=admin123`
- Пароли хешируются через bcrypt (bcrypt.hashpw)
- JWT токен выдается после успешной авторизации

**Индексы:**
- PRIMARY KEY на `id`
- UNIQUE на `login`

---

## Диаграмма связей (ER-диаграмма)

```
┌─────────┐
│  users  │
└────┬────┘
     │
     │ 1:N
     ▼
┌─────────┐      ┌─────────┐
│ orders  │◄────►│ cities  │
└─────────┘ N:1  └────┬────┘
                      │
                      │ 1:N
                      ▼
                 ┌──────────────┐
                 │city_distances│
                 └──────────────┘

┌─────────────┐
│fixed_routes │  (независимая, поиск по from_city + to_city)
└─────────────┘

┌─────────┐
│ tariffs │  (независимая, выбор по month)
└─────────┘

┌─────────┐
│ admins  │  (независимая)
└─────────┘
```

**Детали связей:**
- `users (1) ──< (N) orders` — один пользователь может иметь много заказов
- `cities (1) ──< (N) orders [from_city_id]` — один город может быть отправлением для многих заказов
- `cities (1) ──< (N) orders [to_city_id]` — один город может быть назначением для многих заказов
- `cities (1) ──< (N) city_distances [from_city_id]` — расстояния из города
- `cities (1) ──< (N) city_distances [to_city_id]` — расстояния до города

---

## Начальные данные (seed.py)

### Города (с координатами)
- **Москва** (55.7558, 37.6173)
- **Сочи** (43.6028, 39.7342)
- **Санкт-Петербург** (59.9343, 30.3351)
- **Бишкек** (42.8746, 74.5698)

### Тарифы
Для каждого месяца (1-12):
- `price_per_km_le_1000 = 150` руб/км
- `price_per_km_gt_1000 = 100` руб/км

### Фикс-маршруты
- Москва → Сочи: **200 000 руб**
- Сочи → Москва: **200 000 руб**
- Москва → Бишкек: **350 000 руб**
- Бишкек → Москва: **350 000 руб**

### Расстояния (импорт из offline_matrix.json)
Автоматически импортируются в таблицу `city_distances` с флагом `is_manual=TRUE`.

### Админ
- `login: admin`
- `password: admin123`

---

## Миграции

Автоматическое создание таблиц выполняется через `Base.metadata.create_all()` в `seed.py` при старте приложения.

Для продакшна рекомендуется использовать Alembic:
```bash
alembic upgrade head
```

---

## SQL для создания таблиц (справочно)

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(200) NOT NULL,
    phone VARCHAR(32) NOT NULL
);

CREATE TABLE cities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    latitude FLOAT,
    longitude FLOAT
);

CREATE TABLE tariffs (
    id SERIAL PRIMARY KEY,
    month INTEGER NOT NULL,
    price_per_km_le_1000 INTEGER NOT NULL,
    price_per_km_gt_1000 INTEGER NOT NULL
);

CREATE TABLE fixed_routes (
    id SERIAL PRIMARY KEY,
    from_city VARCHAR(120) NOT NULL,
    to_city VARCHAR(120) NOT NULL,
    fixed_price INTEGER NOT NULL
);

CREATE TABLE city_distances (
    id SERIAL PRIMARY KEY,
    from_city_id INTEGER REFERENCES cities(id),
    to_city_id INTEGER REFERENCES cities(id),
    distance_km INTEGER NOT NULL,
    is_manual BOOLEAN DEFAULT FALSE
);

CREATE TYPE payment_status AS ENUM ('PENDING', 'PAID', 'MANUAL');

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    car_brand_model VARCHAR(120) NOT NULL,
    from_city_id INTEGER REFERENCES cities(id),
    to_city_id INTEGER REFERENCES cities(id),
    start_date DATE NOT NULL,
    distance_km INTEGER NOT NULL,
    applied_price_per_km INTEGER,
    is_fixed_route BOOLEAN DEFAULT FALSE,
    transport_price INTEGER NOT NULL,
    insurance_price INTEGER NOT NULL,
    duration_hours INTEGER NOT NULL,
    duration_days INTEGER NOT NULL,
    duration_hours_remainder INTEGER NOT NULL,
    eta_date DATE NOT NULL,
    payment_status payment_status DEFAULT 'PENDING'
);

CREATE INDEX ix_orders_user_id ON orders(user_id);
CREATE INDEX ix_orders_start_date ON orders(start_date);
CREATE INDEX ix_orders_payment_status ON orders(payment_status);
CREATE INDEX ix_orders_from_to ON orders(from_city_id, to_city_id);

CREATE TABLE admins (
    id SERIAL PRIMARY KEY,
    login VARCHAR(64) UNIQUE NOT NULL,
    password_hash VARCHAR(256) NOT NULL
);
```

