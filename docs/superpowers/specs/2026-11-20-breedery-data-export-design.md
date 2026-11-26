# Breedery data export (Settings → Export data)

Spans `pets.backend.dev` and `pets.frontend.dev`. Draft 2026-11-20.

## Why

A breeder who decides to leave Breedly should be able to take the whole history of their
breedery with them: every pet, breeding and offspring (sold ones too), the locations, and
all photos and documents. Today there is no export of any kind.

## Goals

- One button in Settings produces a single ZIP with all of the breeder's records as
  spreadsheets (CSV) plus every photo and document file.
- It works for large libraries and slow connections: the archive is built in the
  background and downloaded once ready.
- Only the owner can download their archive.

## Non-goals

- Messages, reviews, waitlist entries, application forms, billing/invoices. (Possible
  later additions; the user asked for pets, breedings, offspring, locations.)
- Importing an export back into Breedly (the CSV pet import already exists separately).
- Account deletion. Export is independent of leaving.
- Exports for service providers or pet seekers. Breeders only.
- Email notification when ready.

## Anti-goals

- The archive must never be reachable without the owner's auth, except through a
  short-lived link that the owner mints (unused after 60 s it dies; once used it
  lives 1 h so the browser can resume). Uploads under
  `/storage` are publicly served by `StaticFiles`, so the ZIP must not be written there.
- Must not silently drop data: a file missing on disk is listed in the README, not
  skipped quietly.

## Approaches considered

1. Build the ZIP while streaming it to the browser. Simplest, but a dropped connection
   means starting over.
2. **Build in the background, show "Preparing…", then a Download button; keep the file
   24 h (chosen by the user).** More robust for big libraries and mobile.
3. Option 2 plus an emailed link. Most moving parts; depends on email delivery.

## Design

### User flow (frontend)

- New Settings sidebar item **Export data** (breeders only), route
  `/settings/export`, standalone-false component `export-settings` like its siblings.
- The page explains what's included and shows one of these states:
  - **None / expired:** "Export my data" button.
  - **Preparing:** spinner, "Preparing your archive… you can leave this page; it keeps
    going." Polls status every 3 s while the page is open.
  - **Ready:** "Download (123 MB)" button, created time, "Available until <time>",
    plus "Create a new export".
  - **Failed:** short error and "Try again".
- **Download uses a one-time link (chosen by the user).** Clicking Download calls the
  authenticated `POST /api/exports/{id}/download-link`. That returns a URL with a token,
  and the app then navigates the browser to it (`window.location.href`). The browser
  downloads natively, with its own progress and resume, and nothing is held in page
  memory. The file is served as `breedly-export-YYYY-MM-DD.zip`
  (`Content-Disposition: attachment`).

### Backend

New model `DataExport` (table `data_exports`, Alembic migration):
`id (uuid)`, `user_id (fk users, cascade)`, `status` (`pending|running|ready|failed`),
`file_path` (nullable), `file_size` (nullable), `error` (nullable, short text),
`created_at`, `completed_at` (nullable), `expires_at` (nullable),
`download_token_hash` (nullable, indexed), `download_token_expires_at` (nullable),
`download_token_used_at` (nullable).

Endpoints under `/api/exports` (breeder auth via the existing current-active-user
dependency):

- `POST /api/exports` → creates an export and schedules the job with FastAPI
  `BackgroundTasks`; returns the export. If the user already has a `pending`/`running`
  export, return that one (202-style, no duplicate job). Starting a new export deletes
  the user's previous ready file.
- `GET /api/exports/latest` → the user's most recent export or `null`.
- `POST /api/exports/{id}/download-link` (auth) → `{url}` if the export belongs to the
  user, is `ready` and not expired; 404 otherwise, 410 if expired. The token is a random
  `secrets.token_urlsafe(32)`. Only its SHA-256 is stored on the export row
  (`download_token_hash`, `download_token_expires_at`). It is kept in the database rather
  than Redis because `get_redis()` degrades to `None` when Redis is down. Minting a new
  link replaces the previous one.
- `GET /api/exports/download/{token}` (no auth header) → looks up the token and serves
  the ZIP with `FileResponse`, which supports `Range` so the browser can resume. An
  unknown or expired token returns 404. **Lifetime:** the token must be used within 60 s
  of being minted. On first use `download_token_used_at` is set and the expiry moves to 1 h after that, so resume requests after a
  dropped connection still work, and it can't be used after that. It is bound to that
  one export: a new export or deleting the file makes it 404. Starting a fresh download
  later means clicking Download again.

Job (`app/services/data_export_service.py`): opens its own DB session
(`async_session_maker`), marks `running`, queries all data for the user, writes the ZIP
to a private directory `settings.export_path` (new setting, default `private/exports`).
It must be outside the directory `app/main.py` serves with `StaticFiles`, which is the
**parent** of `storage_path` (`/app` in production). Startup refuses an export dir inside it
(`assert_export_dir_private`). When deployed, it is `/var/lib/breedly/exports` on a new named volume
(`backend_exports`). Add the volume and the `EXPORT_PATH` env var to **both**
`pets.backend.dev/delivery/docker-compose.yml` and `pets.frontend.dev/delivery/docker-compose.yml`,
because each Jenkinsfile overwrites the shared compose file on the server. Then marks `ready` with size and
`expires_at = now + 24h`. Any exception marks `failed` with a short message and removes
the partial file. Heavy ZIP writing runs in a thread (`asyncio.to_thread`) so the event
loop isn't blocked. Images/PDFs are added with `ZIP_STORED` (already compressed); CSVs
with `ZIP_DEFLATED`.

> **Superseded 2026-11-26:** `pets.frontend.dev/delivery/docker-compose.yml` was removed. The dev stack compose lives only in `pets.backend.dev/delivery/docker-compose.yml`; the frontend pipeline no longer uploads a compose file and restarts only `frontend` (`--no-deps`). Make deployed-stack changes in the backend repo only.

Cleanup: on each `POST` and `GET latest`, expired ready exports for that user have
their files deleted. There is no `expired` status value: the API derives
`is_expired` from `expires_at`; plus a startup sweep that deletes all
expired files and marks exports stuck in `pending/running` for over 1 h as `failed`
(covers a restart mid-job).

### ZIP contents

```
breedly-export-2026-11-20/
  README.txt            what each file is, export date, counts, any missing files
  locations.csv
  pets.csv              includes soft-deleted pets with deleted=yes
  breedings.csv
  breeding_pets.csv     breeding ↔ pet links
  matings.csv
  progesterone_tests.csv
  milestones.csv
  offspring.csv         every status: Available, Reserved, Sold, Archived
  photos/pets/<pet-name>_<pet-id>/<n>_<original-name>   pet_images rows + legacy pets.image_path
  photos/offspring/<name>_<id>/<n>.<ext>
  documents/pets/<pet-name>_<pet-id>/<file_name>
  documents/offspring/<name>_<id>/<file_name>
```

CSV rules: UTF-8 with BOM (so Excel opens accents correctly), one row per record, all
of the model's own columns except internal ones (`user_id`, `coordinates`, `error`, and
the raw storage paths), plus readable columns: breed name, location name, father/mother names,
sire name for matings. IDs are kept so rows can be cross-referenced. File and folder
names are sanitized (no `/`, `..`, control chars) and de-duplicated.

## Builder's calls (not discussed with the user)

- Soft-deleted pets' photos and documents are included too (nothing dropped silently).
- Parents and sires owned by other breeders appear by name only; none of their files or
  records are exported.

- Breeders only; menu hidden for others.
- 24 h availability, one live export per user.
- No hard size limit; if real archives get huge, revisit.
- Tests: backend integration tests for the endpoints (ownership, duplicate-job,
  expiry), a unit test of the ZIP builder checking file list and CSV headers; frontend
  spec for the four states and polling stop on destroy.
