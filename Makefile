up:
	docker compose up --build

api-dev:
	cd backend && uvicorn app.main:app --reload --port 8000


