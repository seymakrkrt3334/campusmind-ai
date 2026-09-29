# CampusMind AI

CampusMind AI is a campus assistant that answers university-related questions using chat and retrieval-augmented generation (RAG).

## Current status

**Phase 1A (PostgreSQL + Docker Compose) is in progress.** Phase 0 documentation and layout are done. Local Postgres is defined in `docker-compose.yml`. NestJS, Prisma, FastAPI, and Expo scaffolding are **not** started yet.

## v1 scope

**In scope**

- Campus chat with RAG over campus-related information
- React Native (Expo) mobile client
- NestJS REST API as the system of record
- PostgreSQL + Prisma for persistence
- FastAPI AI service for LLM + RAG (implementation in later phases)

**Out of scope for v1**

- Classical ML prediction endpoints
- Authentication endpoints (User model may exist early for a future auth system)
- Full production microservices mesh

## Approved stack

| Layer | Technology |
|-------|------------|
| Mobile | React Native, Expo, TypeScript |
| Core API | Node.js, NestJS, TypeScript, REST |
| Database | PostgreSQL, Prisma ORM |
| AI service | Python, FastAPI, OpenAI-compatible LLM interface, RAG |
| Infra (later) | Docker, Docker Compose, GitHub Actions, tests, linting, security checks |

## Repository layout

```text
apps/
  api/          # NestJS REST API (Phase 1+)
  ai-service/   # FastAPI AI / RAG service (Phase 1+)
  mobile/       # Expo React Native app (Phase 1+)
docs/           # Architecture and ADRs
data/           # Datasets (raw ignored; sample docs later)
models/         # Reserved for future ML artifacts
notebooks/      # Jupyter exploration (preserved)
src/            # Legacy / shared Python workspace (preserved)
tests/          # Root-level test placeholder (preserved)
api/            # Deprecated empty scaffold — see api/README.md
frontend/       # Deprecated empty scaffold — see frontend/README.md
```

## Quick start (Phase 1A — PostgreSQL)

**Prerequisite:** Docker Desktop (or Docker Engine + Compose). If Docker is not installed, install it yourself before continuing — this repo does not install Docker for you.

1. Copy `.env.example` to `.env` (never commit `.env`).
2. Start Postgres:

```bash
docker compose up -d
```

3. Check status and health:

```bash
docker compose ps
docker compose exec postgres pg_isready -U campusmind -d campusmind
```

4. Stop when finished:

```bash
docker compose stop
```

Full details: [docs/postgres.md](docs/postgres.md).

Application services (NestJS, FastAPI, Expo) are scaffolded in later Phase 1 steps.

## Documentation

- [Architecture](docs/architecture.md)
- [Environment variables](docs/environment.md)
- [Local PostgreSQL](docs/postgres.md)
- [ADR 0001 — Stack choices](docs/adr/0001-stack-choices.md)

## Python / ML assets

The root `requirements.txt` is a **legacy Jupyter / classical ML environment freeze**. It is preserved intentionally. The FastAPI AI service will use its own requirements file under `apps/ai-service/` in Phase 1. Notebooks under `notebooks/` remain available for exploration.

## License

To be decided.
