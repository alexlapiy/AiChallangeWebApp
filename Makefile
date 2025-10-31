up:
	docker compose up --build

api-dev:
	cd backend && uvicorn app.main:app --reload --port 8000

api-setup:
	backend/venv/bin/pip install --upgrade pip
	backend/venv/bin/pip install -r backend/requirements.txt

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


