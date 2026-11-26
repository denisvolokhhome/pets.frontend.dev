# Breedery Data Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Breeders can build a ZIP of all their records plus photos and documents in the
background from Settings → Export data, then download it with a short-lived link.

**Architecture:** A new `data_exports` table tracks jobs. A FastAPI `BackgroundTasks`
job builds the ZIP in a private directory using its own DB session. Downloads go through
a token minted by an authenticated call; only the token's hash is stored on the row.
The frontend adds a Settings child route that polls status.

**Tech Stack:** FastAPI, async SQLAlchemy 2, Alembic, stdlib `zipfile`/`csv`; Angular 21
(NgModule), Karma/Jasmine.

**Spec:** `pets.frontend.dev/docs/superpowers/specs/2026-11-20-breedery-data-export-design.md`

## Global Constraints

- Export dir default `private/exports` (setting `export_path`, env `EXPORT_PATH`), never under `storage/`.
- Ready file lifetime 24 h; stale `pending/running` > 1 h → `failed`.
- Download token: `secrets.token_urlsafe(32)`, store SHA-256 only; unused expiry 60 s; on first use expiry = used_at + 1 h.
- CSVs UTF-8 with BOM; images/PDFs `ZIP_STORED`, CSV/README `ZIP_DEFLATED`.
- Root folder in ZIP `breedly-export-YYYY-MM-DD/`; download filename `breedly-export-YYYY-MM-DD.zip`.
- Breeders only (backend: 403 for non-breeders; frontend: menu + route guarded).
- Branch `feature/data-export` in both repos off `develop`.

## Review Focus

- Path traversal via pet/offspring/document names (`../x`, `a/b`, empty name) → sanitized, de-duplicated entry names. Test in Task 2.
- A file row whose file is missing on disk → export still succeeds; README lists it. Test in Task 2.
- Another user's export id or token → 404, never the file. Test in Task 3.
- Clicking Export twice quickly → one job, same export returned. Test in Task 3.
- Leaving the page while polling → polling stops (no leaked interval). Test in Task 5.

---

### Task 1: Model, migration, settings

**Files:**
- Create: `fastapi-backend/app/models/data_export.py`, `fastapi-backend/alembic/versions/r5s6t7u8v9w0_add_data_exports.py` (down_revision `q4r5s6t7u8v9`)
- Modify: `app/models/__init__.py`, `app/config.py` (`export_path: str = "private/exports"`), `app/main.py` lifespan (mkdir export path), `.gitignore` (`private/`)

**Interfaces — Produces:** `DataExport` with columns per spec: `id: uuid pk`, `user_id fk users cascade, indexed`, `status: String(16)` default `'pending'`, `file_path`, `file_size: BigInteger`, `error: String(500)`, `created_at`, `completed_at`, `expires_at`, `download_token_hash: String(64) indexed`, `download_token_expires_at`, `download_token_used_at`.

- [ ] Write model + migration; `alembic upgrade head` on breedly_dev succeeds; `alembic downgrade -1 && alembic upgrade head` round-trips.
- [ ] Commit `feat(export): data_exports model and migration`.

### Task 2: ZIP builder (pure-ish service)

**Files:**
- Create: `app/services/data_export_service.py`, `tests/integration/test_data_export_builder.py`

**Interfaces — Produces:**
- `async def collect_export_data(session, user_id) -> ExportData` (dataclass of row lists + file entries)
- `def write_export_zip(data: ExportData, storage_root: Path, dest: Path, export_date: date) -> list[str]` returns missing-file list (sync; called via `asyncio.to_thread`)
- `def safe_name(name: str | None, fallback: str) -> str`
- `async def run_export(export_id: uuid.UUID, session_factory) -> None` — marks running → ready (size, completed_at, expires_at=+24h) or failed (error[:500], partial file removed)
- `async def sweep_exports(session_factory) -> None` — deletes files of expired ready exports, fails stale jobs

CSV files and readable columns per spec "ZIP contents". Photo sources: `pet_images.image_path`, legacy `pets.image_path`, `offspring_images.image_path`; documents from `documents` (entity_type `pet`/`offspring`), all relative to `settings.storage_path`.

- [ ] Tests (fail first):
  - `test_zip_contains_all_csvs_and_files`: breeder with location, pet (+image file, +document), deleted pet, breeding with mating/progesterone/milestone, Sold offspring with image → namelist contains every CSV in the spec, `photos/pets/...`, `documents/pets/...`, `photos/offspring/...`; `pets.csv` starts with `﻿` and has the deleted pet with `deleted=yes`; `offspring.csv` has the Sold row.
  - `test_other_users_data_excluded`: second breeder's pet absent from `pets.csv`.
  - `test_missing_file_listed_in_readme`: document row with no file → no exception, README contains its file_name.
  - `test_safe_name`: `safe_name("../a/b", "x") == "a_b"`-style (no `/`, no `..`), `safe_name("", "pet") == "pet"`; duplicate names in one folder get `_2` suffix.
  - `test_run_export_marks_ready` / `test_run_export_marks_failed` (monkeypatch writer to raise → status failed, no file).
- [ ] Implement; tests pass; ruff clean.
- [ ] Commit `feat(export): build export archive`.

### Task 3: API endpoints

**Files:**
- Create: `app/routers/exports.py`, `app/schemas/data_export.py`, `tests/integration/test_data_export_api.py`
- Modify: `app/main.py` (include router; call `sweep_exports(async_session_maker)` in lifespan when not TESTING)

**Interfaces — Produces (frontend relies on these):**
- `DataExportRead`: `id, status, file_size, error, created_at, completed_at, expires_at, is_expired: bool`
- `POST /api/exports` → 202 `DataExportRead` (existing pending/running returned as-is; else delete previous file, create, schedule `run_export`)
- `GET /api/exports/latest` → `DataExportRead | null`
- `POST /api/exports/{id}/download-link` → `{"url": "<API base>/api/exports/download/<token>"}` (build from `request.url_for`)
- `GET /api/exports/download/{token}` → `FileResponse` zip, `Content-Disposition: attachment; filename=breedly-export-YYYY-MM-DD.zip`
- Dependency `get_export_session_factory()` returning `async_session_maker` (tests override to reuse the test session).

- [ ] Tests (fail first): non-breeder 403; POST twice → same id while pending; latest returns null then export; full flow (POST → job runs → latest ready → mint link → GET download 200 with zip bytes → GET again within hour 200); token unused > 60 s → 404 (set `download_token_expires_at` in past); other user's export id → 404 on download-link; expired ready export → 410 on download-link and `is_expired` true.
- [ ] Implement; tests pass.
- [ ] Commit `feat(export): export API with one-time download links`.

### Task 4: Deploy config

**Files:** `pets.backend.dev/delivery/docker-compose.yml` and `pets.frontend.dev/delivery/docker-compose.yml`: backend env `EXPORT_PATH: /app/private/exports`, volume `backend_exports:/app/private/exports`, declare `backend_exports`.

> **Superseded 2026-11-26:** `pets.frontend.dev/delivery/docker-compose.yml` was removed. The dev stack compose lives only in `pets.backend.dev/delivery/docker-compose.yml`; the frontend pipeline no longer uploads a compose file and restarts only `frontend` (`--no-deps`). Make deployed-stack changes in the backend repo only.

- [ ] Edit both; `docker compose -f ... config -q` passes for each.
- [ ] Commit in each repo `chore(deploy): export volume`.

### Task 5: Frontend Export page

**Files:**
- Create: `src/app/services/data-export.service.ts`, `src/app/models/data-export.ts`, `src/app/components/settings/export-settings/export-settings.component.{ts,html,css,spec.ts}`
- Modify: `app.module.ts` (declare), `app-routing.module.ts` (settings child `export`, BreederGuard), `settings.component.html` (sidebar "Export data", `isBreeder`), privacy policy (one line on data export), `docs/qa/` breeder settings script.

**Interfaces — Produces:** `DataExportService.start(): Observable<DataExport>`, `latest(): Observable<DataExport|null>`, `downloadLink(id): Observable<{url:string}>`.

Component states per spec (none/expired, preparing with 3 s polling via `timer`+`switchMap` until status not pending/running, ready with size + "Available until", failed with Try again). Download: `downloadLink` then `window.location.href = url` (wrap in a `navigate(url)` method so specs can spy).

- [ ] Spec (fail first): shows Export button when latest null; shows preparing and polls until ready (fakeAsync, tick 3000); ready shows formatted size and calls `navigate` with returned url on Download; failed shows Try again which calls `start`; `ngOnDestroy` stops polling (no further `latest` calls after destroy + tick).
- [ ] Implement; spec passes; `npx ng build --configuration development` clean (strip ANSI).
- [ ] Verify in browser with Playwright at 1280 and 390 px against dev stack: export QA breeder, download, unzip, inspect.
- [ ] Commit `feat(export): Settings → Export data page`.
