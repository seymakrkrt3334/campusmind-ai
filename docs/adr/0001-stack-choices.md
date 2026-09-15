# ADR 0001 — Stack choices

## Status

Accepted

## Date

2026-09-15

## Context

CampusMind AI needs a portfolio-ready architecture for a campus chat / RAG product. The repository started as a Python/Jupyter scaffold with empty `api/` and `frontend/` folders. We need a clear stack that separates the product API, the AI workload, and the mobile client without deleting useful existing Python/ML assets.

## Decision

| Concern | Choice | Notes |
|---------|--------|-------|
| Mobile | React Native + Expo + TypeScript | Fast local iteration; TypeScript for safety |
| Core backend | NestJS + TypeScript + REST | System of record, orchestration, future auth |
| Database | PostgreSQL + Prisma | Relational persistence aligned with NestJS |
| AI service | FastAPI + Python | LLM + RAG; keeps Python ML/notebook ecosystem nearby |
| LLM access | OpenAI-compatible / provider-agnostic interface | Env names like `LLM_API_KEY`, `LLM_BASE_URL` |
| Monorepo layout | Option A: `apps/api`, `apps/mobile`, `apps/ai-service` | Legacy empty `api/` and `frontend/` deprecated in place |
| v1 product focus | Campus chat / RAG only | No classical ML prediction in v1 |

## Consequences

**Positive**

- Clear boundaries between UI, API, and AI
- Prisma fits NestJS naturally
- Python remains available for RAG and future ML work under `notebooks/`, `models/`, and `apps/ai-service/`
- Provider-agnostic LLM config avoids locking the demo to one vendor

**Negative / trade-offs**

- Two runtimes (Node and Python) increase local setup complexity
- Expo abstracts native modules (acceptable for v1 portfolio scope)
- Legacy root folders (`api/`, `frontend/`) remain until optionally removed later

## Alternatives considered

- Single Python monolith (FastAPI only) — simpler ops, weaker Nest/Prisma portfolio signal and less ideal for RN-centric API patterns
- Prisma replaced by SQLAlchemy — rejected because core API is NestJS
- Bare React Native CLI instead of Expo — more native control, slower Phase 1 setup
- Implementing classical ML in v1 — deferred to keep focus on chat/RAG
