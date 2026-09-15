# apps/ai-service

**Status:** Phase 0 placeholder — FastAPI is **not** scaffolded yet.

## Planned role

Python AI service:

- FastAPI
- OpenAI-compatible / provider-agnostic LLM client (Phase 2+)
- RAG over campus-related information (Phase 2+)
- Health endpoint in Phase 1

## Dependencies

This service will use its **own** `requirements.txt` in Phase 1. The repository root `requirements.txt` remains the legacy Jupyter / classical ML freeze and must be preserved.

Do not implement LLM or RAG logic in Phase 0 or Phase 1 beyond health-check scaffolding when Phase 1 is approved.
