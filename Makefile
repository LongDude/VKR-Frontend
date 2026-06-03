COMPOSE := docker compose

.DEFAULT_GOAL := help

.PHONY: help up-dev up-prod down build logs ps

help:
	@echo Available commands:
	@echo   make up-dev   - Start frontend development environment
	@echo   make up-prod  - Build and start frontend containers for production-like run
	@echo   make down     - Stop frontend containers
	@echo   make build    - Build frontend Docker image
	@echo   make logs     - Follow frontend container logs
	@echo   make ps       - Show frontend container status

up-dev: export NODE_ENV=development
up-dev:
	$(COMPOSE) up -d

up-prod: export NODE_ENV=production
up-prod:
	$(COMPOSE) up -d --build

down:
	$(COMPOSE) down --remove-orphans

build:
	$(COMPOSE) build

logs:
	$(COMPOSE) logs -f

ps:
	$(COMPOSE) ps
