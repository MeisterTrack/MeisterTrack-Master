.PHONY: up down build logs backend-shell migrate revision seed test

up:
	docker compose up -d

down:
	docker compose down

build:
	docker compose build

logs:
	docker compose logs -f

backend-shell:
	docker compose exec backend bash

migrate:
	docker compose exec backend alembic upgrade head

revision:
	docker compose exec backend alembic revision --autogenerate -m "$(m)"

seed:
	docker compose exec backend python -m app.db.seed_scoring

test:
	docker compose exec backend pytest
