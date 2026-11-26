# Object Storage (RustFS) and Private Documents Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Store all uploads in RustFS; documents become private (owner + chat participants, 15-min signed links); photos keep their public `/storage/...` URLs.

**Architecture:** A small `ObjectStorage` interface (S3 via boto3, in-memory for tests) behind `FileService`. Photos are streamed by a backend route at the old URLs; documents by a signed-link route. Existing local files move into RustFS at startup.

**Tech Stack:** FastAPI, boto3 1.44 (sync, called via `asyncio.to_thread`), RustFS `rustfs/rustfs:1.0.6`, Angular 21.

**Spec:** `pets.frontend.dev/docs/superpowers/specs/2026-11-22-object-storage-design.md`

## Global Constraints

- Buckets `photos` and `documents`; settings `S3_ENDPOINT_URL`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_REGION` (default `us-east-1`), `S3_PHOTOS_BUCKET` (`photos`), `S3_DOCUMENTS_BUCKET` (`documents`), `OBJECT_STORAGE` (`s3` | `memory`; tests use `memory`). Path-style addressing, SigV4.
- Signed document link lifetime 900 s; HMAC-SHA256 over `"{doc_id}.{exp}"` with `SECRET_KEY`.
- Photo responses: `Cache-Control: public, max-age=31536000, immutable`. Document responses: `Cache-Control: private, no-store`, `Content-Disposition: inline; filename="<file_name>"`.
- Photo object key = the path already stored in the DB (`<upload dir name>/<file>`). New document keys `doc_<entity_id>_<uuid4><ext>` (no directory prefix).
- RustFS internal only: no published ports in deployed compose, console disabled.
- Deployed-stack changes go into `pets.backend.dev/delivery/docker-compose.yml`, `pets.frontend.dev/delivery/docker-compose.yml`, and `pets.backend.dev/delivery/docker-compose.prod.yml`.

> **Superseded 2026-11-26:** `pets.frontend.dev/delivery/docker-compose.yml` was removed. The dev stack compose lives only in `pets.backend.dev/delivery/docker-compose.yml`; the frontend pipeline no longer uploads a compose file and restarts only `frontend` (`--no-deps`). Make deployed-stack changes in the backend repo only.

## Review Focus

- A seeker whose share message was soft-deleted asks for a document → 404 (Task 4 test).
- A doc id that exists but belongs to another breeder's offspring, referenced in a share message the caller fabricated through `/direct` → impossible (card spoofing already rejected); access check reads only messages whose sender owns the document (Task 4 test).
- Tampered `exp` or `sig`, or an expired link → 403/410, never the file (Task 4 test).
- Startup move run twice, or a document row whose local file is missing → no crash, no duplicate work (Task 6 test).
- Photo path containing `..` or a `doc_` key on the photo route → 404 (Task 3 test).

---

### Task 1: Object storage layer, settings, health check

**Files:** Create `app/services/object_storage.py`, `tests/unit/test_object_storage.py`. Modify `app/config.py`, `app/main.py` (lifespan `ensure_buckets()`, `/health`), `tests/conftest.py` (env `OBJECT_STORAGE=memory`, autouse fixture clearing the memory store), `requirements.txt` (`boto3>=1.35`).

**Interfaces — Produces:**
- `class ObjectNotFound(Exception)`; `@dataclass StoredObject(data: bytes, content_type: str)`
- `class ObjectStorage` (sync methods): `put(bucket, key, data: bytes, content_type: str) -> None`, `get(bucket, key) -> StoredObject` (raises `ObjectNotFound`), `exists(bucket, key) -> bool`, `delete(bucket, key) -> None` (missing is fine), `ensure_buckets() -> None`, `ping() -> None` (raises on failure). Implementations `S3ObjectStorage(settings)`, `MemoryObjectStorage()`.
- `get_object_storage() -> ObjectStorage` (cached singleton chosen by `settings.object_storage`); `reset_object_storage()` for tests.
- `photos_bucket()`, `documents_bucket()` helpers returning names from settings.

- [ ] Tests (fail first): memory put/get/exists/delete round-trip; get missing raises `ObjectNotFound`; `/health` → 200 normally and 503 `{"status":"unhealthy","storage":"unreachable"}` when `ping` raises (monkeypatch).
- [ ] Implement; `ensure_buckets()` creates both buckets if missing (S3: `head_bucket`, `create_bucket` on 404).
- [ ] Commit `feat(storage): object storage layer and storage health check`.

### Task 2: FileService on object storage

**Files:** Modify `app/services/file_service.py`, `app/routers/users.py` (profile image GET reads from storage). Update tests that read files from disk after upload (grep `storage_path` / `exists()` in `tests/`).

**Interfaces — Consumes:** Task 1. **Produces:** unchanged public method names and return values of `FileService` (`save_image`, `rotate_image`, `delete_image`, `save_profile_image`, `delete_profile_image`, `save_document` → `(key, original_name, content_type, size)`, `delete_document`), all backed by storage. Image keys `f"{Path(settings.storage_path).name}/{filename}"`.

- [ ] Tests (fail first): uploading a pet image stores it in the photos bucket under the returned path; rotate stores the new key and deletes the old; `save_document` stores in documents bucket with key `doc_<entity>_<uuid><ext>` and nothing is written to `STORAGE_PATH`.
- [ ] Implement; nothing writes to local disk any more.
- [ ] Commit `feat(storage): uploads go to RustFS`.

### Task 3: Serve photos at the existing URLs

**Files:** Modify `app/main.py` (replace the `StaticFiles` mount with a route), rewrite `tests/integration/test_storage_mount.py`.

**Interfaces — Produces:** `GET {storage_url}/{upload_dir_name}/{rest:path}` → photo bytes from the photos bucket, key `f"{upload_dir_name}/{rest}"`, content type from the object. 404 for keys containing `..`, starting with `doc_`, or missing. Fallback while local copies exist: if not in the bucket and the local file `STORAGE_PATH/rest` exists (and is inside `STORAGE_PATH`), serve it.

- [ ] Tests (fail first): stored photo served at `/storage/<path>` with the cache header; `doc_*` → 404; `..`/`%2e%2e` → 404; local-only file still served (fallback); unknown → 404.
- [ ] Implement; commit `feat(storage): serve photos from RustFS at the same URLs`.

### Task 4: Private documents with signed links

**Files:** Create `app/services/document_access.py`, `app/routers/documents.py`, `tests/integration/test_document_access.py`. Modify `app/routers/pets.py`, `app/routers/offsprings.py` (list/upload responses: `file_url` = signed link), `app/routers/messages.py` (share message stores `{id, file_name, file_type, file_size}` without `file_url`; new `GET /api/messages/threads/{thread_id}/documents`), `app/main.py` (include router).

**Interfaces — Produces:**
- `sign_document_url(doc_id: int, now: datetime | None = None) -> str` → `/api/documents/download/{id}?exp={unix}&sig={hex}`
- `async can_access_document(session, user, doc) -> bool`: owner (pet/offspring `user_id`) or participant of a thread containing a non-deleted message from the owner whose JSON content has `__type == "documents"` and lists this id.
- `GET /api/documents/download/{doc_id}` (no auth; validates sig/exp: bad sig 403, expired 410, unknown doc 404) streams from documents bucket.
- `GET /api/messages/threads/{thread_id}/documents` (participant only) → `[{id, file_name, file_type, file_size, url}]` for documents shared in that thread that still exist and are still accessible.

- [ ] Tests (fail first): owner list returns signed `file_url` that downloads; tampered sig 403; expired 410; seeker in the share thread gets links; seeker after share message soft-deleted gets none; stranger gets 404 on thread endpoint; old-format share message (with `file_url`) still resolves by id; `/storage/doc_*` 404.
- [ ] Implement; commit `feat(documents): private documents with 15-minute signed links`.

### Task 5: Export reads from storage

**Files:** Modify `app/services/data_export_service.py` (`FileEntry` gains `bucket`; `write_export_zip(data, storage, dest, export_date) -> list[str]` reads via `storage.get`; drop `_storage_root`/`_allowed_root`), update `tests/integration/test_data_export_builder.py` and `test_data_export_api.py` fixtures to put files into memory storage.

- [ ] Update tests first (they fail against disk-reading code), implement, all export tests pass. Commit `feat(export): read photos and documents from RustFS`.

### Task 6: Move existing files at startup

**Files:** Create `app/services/storage_migration.py`, `tests/integration/test_storage_migration.py`. Modify `app/main.py` lifespan (after `ensure_buckets`, when `TESTING != 1`).

**Interfaces — Produces:** `async migrate_local_files(session_factory, storage, upload_dir: Path) -> MigrationReport(documents_moved, photos_copied, missing: list[str])`.
- Documents: rows whose `file_path` contains `/` (legacy local path): read `upload_dir.parent / file_path`, put to documents bucket under a new `doc_` key, update row, commit, then delete the local file. Missing file → listed, row untouched.
- Photos: every file in `upload_dir` not starting with `doc_` → put to photos bucket under `f"{upload_dir.name}/{name}"` if not already there. Local copies kept.

- [ ] Tests (fail first): documents moved and local copy gone; photo copied and local copy kept; second run moves nothing; missing document file reported, no exception.
- [ ] Implement; commit `feat(storage): move existing uploads into RustFS at startup`.

### Task 7: Deployment and local dev

**Files:** `delivery/docker-compose.yml` (both repos), `delivery/docker-compose.prod.yml`, `delivery/prod/deploy.sh` (archive RustFS volume via `compose exec -T rustfs tar -C /data -czf - .`, keep `KEEP_PREDEPLOY_BACKUPS`), `deploy/Dockerfile` + dev compose healthchecks fail on non-200, `fastapi-backend/docker-compose.yml` (rustfs on 127.0.0.1:9000), `dev.sh` (start rustfs, `.env` S3 vars), `.env.example`, `docs/` env-var doc.

> **Superseded 2026-11-26:** `pets.frontend.dev/delivery/docker-compose.yml` was removed. The dev stack compose lives only in `pets.backend.dev/delivery/docker-compose.yml`; the frontend pipeline no longer uploads a compose file and restarts only `frontend` (`--no-deps`). Make deployed-stack changes in the backend repo only.

- [ ] `rustfs` service: image `rustfs/rustfs:1.0.6`, env `RUSTFS_ACCESS_KEY: ${S3_ACCESS_KEY}`, `RUSTFS_SECRET_KEY: ${S3_SECRET_KEY}`, volume `rustfs_data:/data`, healthcheck `curl -fsS http://127.0.0.1:9000/health`; backend env `S3_ENDPOINT_URL: http://rustfs:9000` + keys, `depends_on: rustfs: service_healthy`.
- [ ] `docker compose -f … config -q` passes for all three; local `dev.sh` brings RustFS up and backend `/health` is 200.
- [ ] Commit in each repo `chore(deploy): RustFS object storage`.

### Task 8: Frontend documents card

**Files:** Modify the existing message service (add `getThreadDocuments(threadId): Observable<SharedDocument[]>`) and `message-thread.component.{ts,html,css,spec.ts}`.

**Interfaces — Consumes:** `GET /api/messages/threads/{thread_id}/documents`.

- [ ] Spec (fail first): a message with `__type: "documents"` renders a card listing file names with View links built from `API_HOST + url`, never raw JSON; the card loads links once per thread.
- [ ] Implement; Karma spec passes; build clean; check at 390 px. Commit `feat(messages): Documents shared card`.
