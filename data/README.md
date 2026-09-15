# data/

CampusMind data workspace.

## Layout

| Path | Purpose | Git |
|------|---------|-----|
| `raw/` | Large or private raw datasets | **Ignored** (see root `.gitignore`) |
| `interim/` | Intermediate transform outputs (local processing) | Local workspace; avoid committing large files |
| `processed/` | Cleaned datasets ready for experiments | Prefer small samples only if committing |
| `sample/` | Small, safe, shareable campus sample documents for RAG demos | Tracked when added (Phase 2+) |
| `private/` | Explicitly private local data (if used) | **Ignored** |

## Rules

- Do not commit secrets, credentials, or private student data.
- Prefer synthetic or public campus-style sample content under `sample/`.
- Classical ML datasets may use `raw/` locally; keep them out of Git.

## Status

Phase 0: documentation only. No sample corpus is required until RAG work begins.
