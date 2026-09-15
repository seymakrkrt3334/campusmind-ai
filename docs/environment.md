# Environment configuration

## Rules

- Copy `.env.example` to `.env` for local development.
- **Never commit** `.env` or real API keys, passwords, or tokens.
- Prefer provider-agnostic LLM variable names (`LLM_*`).
- Phase 0 only defines the contract. Services that read these variables are created in Phase 1+.

## Variable reference

| Variable | Used by (planned) | Purpose | Example / placeholder |
|----------|-------------------|---------|------------------------|
| `DATABASE_URL` | `apps/api` (Prisma) | PostgreSQL connection string | `postgresql://campusmind:campusmind@localhost:5432/campusmind?schema=public` |
| `API_PORT` | `apps/api` | NestJS listen port | `3000` |
| `AI_SERVICE_URL` | `apps/api` | Base URL for FastAPI AI service | `http://localhost:8000` |
| `AI_SERVICE_PORT` | `apps/ai-service` | FastAPI listen port | `8000` |
| `LLM_API_KEY` | `apps/ai-service` | API key for OpenAI-compatible provider | leave empty until Phase 2 |
| `LLM_BASE_URL` | `apps/ai-service` | Base URL for OpenAI-compatible API | `https://api.openai.com/v1` or local gateway |
| `LLM_MODEL` | `apps/ai-service` | Default chat model id | `gpt-4o-mini` (placeholder name only) |
| `JWT_SECRET` | `apps/api` (future auth) | Signing secret for JWTs | leave empty in Phase 1 |
| `EXPO_PUBLIC_API_URL` | `apps/mobile` | Nest API base URL for the app | `http://localhost:3000` |

## Notes

- Android emulators often cannot reach the host via `localhost`. Phase 1 docs will cover `10.0.2.2` (Android emulator) vs machine IP for physical devices.
- `JWT_SECRET` and `LLM_*` are reserved early so `.env.example` stays stable; they are not required for Phase 1 health-check work beyond being present as empty/placeholders where appropriate.
- Root `requirements.txt` is unrelated to these app env vars; it documents the legacy Jupyter/ML freeze only.
