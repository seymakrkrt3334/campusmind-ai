# Local PostgreSQL (Phase 1A)

CampusMind uses PostgreSQL 16 via Docker Compose for local development.

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker Engine + Compose plugin)
- Git clone of this repository
- A local `.env` file (copy from `.env.example`)

Confirm Docker works:

```bash
docker --version
docker compose version
```

## Configuration

Compose reads variables from the project-root `.env` file:

| Variable | Default (dev placeholder) | Purpose |
|----------|---------------------------|---------|
| `POSTGRES_DB` | `campusmind` | Database name |
| `POSTGRES_USER` | `campusmind` | Database user |
| `POSTGRES_PASSWORD` | `campusmind` | Database password (dev only) |
| `POSTGRES_PORT` | `5432` | Host port mapped to container `5432` |
| `DATABASE_URL` | `postgresql://campusmind:campusmind@localhost:5432/campusmind?schema=public` | App connection string (later phases) |

Keep `DATABASE_URL` credentials aligned with `POSTGRES_*`. Never commit a real `.env` or production passwords.

Service definition: root [`docker-compose.yml`](../docker-compose.yml).

## Start PostgreSQL

From the repository root:

```bash
cp .env.example .env
docker compose up -d
```

## Stop PostgreSQL

Stop containers (keeps the named volume / data):

```bash
docker compose stop
```

Stop and remove containers (volume data is still kept unless you remove the volume):

```bash
docker compose down
```

Remove containers **and** the database volume (destructive — deletes local DB data):

```bash
docker compose down -v
```

## Check container status

```bash
docker compose ps
docker compose logs postgres --tail 50
```

Healthy status looks like `healthy` (or `Up ... (healthy)`).

## Verify database connectivity

Using the Compose service:

```bash
docker compose exec postgres pg_isready -U campusmind -d campusmind
```

Expected output includes `accepting connections`.

Optional interactive check:

```bash
docker compose exec postgres psql -U campusmind -d campusmind -c "SELECT version();"
```

From the host (if `psql` is installed locally), using values from `.env`:

```bash
psql "postgresql://campusmind:campusmind@localhost:5432/campusmind" -c "SELECT 1;"
```

## Validate Compose file (no start)

```bash
docker compose config
```

## Out of scope for Phase 1A

- NestJS, Prisma models/migrations
- FastAPI AI service
- Expo / React Native
- Authentication, LLM, RAG
