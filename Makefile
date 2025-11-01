up:
	docker compose up --build

db-up:
	docker compose up -d db

db-down:
	docker compose down

api-dev:
	cd backend && DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/shipment venv/bin/uvicorn app.main:app --reload --port 8000

api-setup:
	backend/venv/bin/pip install --upgrade pip
	backend/venv/bin/pip install -r backend/requirements.txt

backend-migrate:
	cd backend && DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/shipment venv/bin/alembic upgrade head

backend-migrate-rollback:
	cd backend && DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/shipment venv/bin/alembic downgrade -1

backend-migrate-create:
	cd backend && DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/shipment venv/bin/alembic revision --autogenerate -m "$(name)"

backend-migrate-stamp:
	cd backend && DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/shipment venv/bin/alembic stamp $(version)

client-dev:
	cd frontend-client && npm run dev

admin-dev:
	cd frontend-admin && npm run dev

client-install:
	cd frontend-client && npm install

admin-install:
	cd frontend-admin && npm install

install-all:
	make api-setup
	make client-install
	make admin-install


