# apps/api

**Status:** Phase 0 placeholder — NestJS is **not** scaffolded yet.

## Planned role

Core backend REST API (system of record):

- NestJS + TypeScript
- PostgreSQL via Prisma
- Orchestrates calls to `apps/ai-service`
- Future authentication (not in Phase 1 endpoints)

## Phase 1 expectations (not started)

- Project scaffold
- Prisma schema (including optional `User` for future auth)
- Health endpoints (`/health`, readiness, AI dependency check)

Do not add NestJS source or install packages until Phase 1 is approved.
