## Local Development

Run all commands from `backend` directory.

### Quick start

```powershell
make setup
make serve
```

`make setup` runs:

1. `npm ci`
2. local Docker postgres startup
3. postgres health wait
4. schema creation for `core` and `products`
5. Prisma migrations
6. Prisma client generation

### Common targets

```powershell
make db-up
make db-down
make wait
make schemas
make migrate
make generate
make test
make build
```

### Creating a migration

```powershell
make migration-create SCHEMA=core NAME=add_audit_indexes
make migration-create SCHEMA=products NAME=add_product_sku
```

## Production Docker Deploy

Build the production image:

```powershell
make docker-build
```

Start the production stack:

```powershell
make prod-up
```

Stop it:

```powershell
make prod-down
```

The production compose file lives in [iac/docker/docker-compose-prod.yml](/c:/Projects/modular-monolith-template/nodeJs/iac/docker/docker-compose-prod.yml).

### Environment variables

The application loads `apps/app-console/config/env.production` as a fallback, but Docker `environment:` values win because `dotenv` does not override existing `process.env`.

Recommended production variables:

```env
POSTGRES_USER=app
POSTGRES_PASSWORD=app
POSTGRES_DB=app
LOG_LEVEL=info
```

You can place them in `iac/docker/.env` or provide them from CI/CD.
