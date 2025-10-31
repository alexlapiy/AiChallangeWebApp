up:
	docker compose up --build

api-dev:
	cd backend && uvicorn app.main:app --reload --port 8000

api-setup:
	backend/venv/bin/pip install --upgrade pip
	backend/venv/bin/pip install -r backend/requirements.txt


