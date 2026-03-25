SHELL := powershell.exe
.SHELLFLAGS := -NoProfile -ExecutionPolicy Bypass -Command
.ONESHELL:

.DEFAULT_GOAL := help

COMPOSE_DEV := docker compose -f iac/docker/docker-compose.yml
COMPOSE_PROD := docker compose -f iac/docker/docker-compose-prod.yml
APP_IMAGE ?= modular-monolith-app-console:latest

POSTGRES_CONTAINER ?= modular-monolith-postgres
POSTGRES_USER ?= app
POSTGRES_PASSWORD ?= app
POSTGRES_DB ?= app
POSTGRES_HOST ?= 127.0.0.1
POSTGRES_PORT ?= 5432

CORE_SCHEMA := libs/core/src/providers/prisma/schema.prisma
PRODUCTS_SCHEMA := libs/products/src/infrastructure/prisma/schema.prisma
CORE_DB_URL := postgresql://$(POSTGRES_USER):$(POSTGRES_PASSWORD)@$(POSTGRES_HOST):$(POSTGRES_PORT)/$(POSTGRES_DB)?schema=core
PRODUCTS_DB_URL := postgresql://$(POSTGRES_USER):$(POSTGRES_PASSWORD)@$(POSTGRES_HOST):$(POSTGRES_PORT)/$(POSTGRES_DB)?schema=products

.PHONY: help install setup db-up db-down wait schemas migrate generate migration-create serve test build docker-build prod-up prod-down

help:
	Write-Host 'Available targets:' -ForegroundColor Cyan
	Write-Host '  make setup                              Full local setup from scratch'
	Write-Host '  make db-up / make db-down              Start or stop local postgres stack'
	Write-Host '  make wait                              Wait for postgres healthcheck'
	Write-Host '  make schemas                           Create prisma schemas in postgres'
	Write-Host '  make migrate                           Apply prisma migrations for core and products'
	Write-Host '  make generate                          Generate prisma clients for core and products'
	Write-Host '  make migration-create SCHEMA=... NAME=...'
	Write-Host '                                         Create a new prisma migration'
	Write-Host '  make serve                             Run nx serve app-console'
	Write-Host '  make test                              Run workspace tests'
	Write-Host '  make build                             Build production artifacts'
	Write-Host '  make docker-build                      Build the production docker image'
	Write-Host '  make prod-up / make prod-down          Start or stop production docker compose'

install:
	npm ci

setup: install db-up wait schemas migrate generate

db-up:
	$(COMPOSE_DEV) up -d

db-down:
	$(COMPOSE_DEV) down

wait:
	$$maxAttempts = 30
	for ($$attempt = 1; $$attempt -le $$maxAttempts; $$attempt++) {
	  $$status = docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' $(POSTGRES_CONTAINER) 2>$$null
	  if ($$LASTEXITCODE -eq 0 -and $$status.Trim() -eq 'healthy') {
	    Write-Host 'Postgres is healthy.' -ForegroundColor Green
	    exit 0
	  }
	  Write-Host "Waiting for postgres healthcheck ($$attempt/$$maxAttempts)..."
	  Start-Sleep -Seconds 2
	}
	throw 'Postgres did not become healthy in time.'

schemas:
	docker exec $(POSTGRES_CONTAINER) psql -v ON_ERROR_STOP=1 -U $(POSTGRES_USER) -d $(POSTGRES_DB) -c "CREATE SCHEMA IF NOT EXISTS \"core\";"
	if ($$LASTEXITCODE -ne 0) { throw 'Failed to create schema core.' }
	docker exec $(POSTGRES_CONTAINER) psql -v ON_ERROR_STOP=1 -U $(POSTGRES_USER) -d $(POSTGRES_DB) -c "CREATE SCHEMA IF NOT EXISTS \"products\";"
	if ($$LASTEXITCODE -ne 0) { throw 'Failed to create schema products.' }

migrate:
	$$env:DATABASE_URL_CORE = '$(CORE_DB_URL)'
	npx prisma migrate deploy --schema $(CORE_SCHEMA)
	if ($$LASTEXITCODE -ne 0) { throw 'Core prisma migrate deploy failed.' }
	$$env:DATABASE_URL_PRODUCTS = '$(PRODUCTS_DB_URL)'
	npx prisma migrate deploy --schema $(PRODUCTS_SCHEMA)
	if ($$LASTEXITCODE -ne 0) { throw 'Products prisma migrate deploy failed.' }

generate:
	$$env:DATABASE_URL_CORE = '$(CORE_DB_URL)'
	npx prisma generate --schema $(CORE_SCHEMA)
	if ($$LASTEXITCODE -ne 0) { throw 'Core prisma generate failed.' }
	$$env:DATABASE_URL_PRODUCTS = '$(PRODUCTS_DB_URL)'
	npx prisma generate --schema $(PRODUCTS_SCHEMA)
	if ($$LASTEXITCODE -ne 0) { throw 'Products prisma generate failed.' }

migration-create:
	if ('$(SCHEMA)' -eq '') { throw 'SCHEMA is required. Use make migration-create SCHEMA=core NAME=my_change' }
	if ('$(NAME)' -eq '') { throw 'NAME is required. Use make migration-create SCHEMA=core NAME=my_change' }
	switch ('$(SCHEMA)') {
	  'core' {
	    $$schemaPath = '$(CORE_SCHEMA)'
	    $$envVar = 'DATABASE_URL_CORE'
	    $$dbUrl = '$(CORE_DB_URL)'
	  }
	  'products' {
	    $$schemaPath = '$(PRODUCTS_SCHEMA)'
	    $$envVar = 'DATABASE_URL_PRODUCTS'
	    $$dbUrl = '$(PRODUCTS_DB_URL)'
	  }
	  default {
	    throw 'SCHEMA must be either core or products.'
	  }
	}
	Set-Item -Path "Env:$$envVar" -Value $$dbUrl
	npx prisma migrate dev --create-only --skip-generate --name $(NAME) --schema $$schemaPath
	if ($$LASTEXITCODE -ne 0) { throw 'Prisma migration creation failed.' }

serve:
	npx nx serve app-console

test:
	npm test

build:
	npx nx run-many --target=build --projects=core,products,integration-contracts,app-console

docker-build:
	docker build -t $(APP_IMAGE) .

prod-up:
	$(COMPOSE_PROD) up -d --build

prod-down:
	$(COMPOSE_PROD) down
