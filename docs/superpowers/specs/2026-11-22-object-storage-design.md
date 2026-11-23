# Object storage (RustFS) and private documents — design

Date: 2026-11-22. Decisions settled with the owner in a grilling session.

## Problem

Pet and offspring documents (health certificates, pedigrees) live in the public
`/storage` folder. Anyone with a document's link can open it, forever, without
signing in. Sharing documents in a chat hands out such permanent links. The
chat also renders a shared-documents message as raw JSON.

## Decisions

1. **Who may open a document:** the breeder who owns it, plus participants of any
   chat where it was shared, while that share message exists (not deleted).
   Deleting the document cuts everyone else off.
2. **Access:** the backend checks access and returns a signed link valid for
   **15 minutes** (`/api/documents/download/{id}?exp=…&sig=…`, HMAC with
   `SECRET_KEY`, no DB state). Opening it streams the file from storage.
3. **Storage:** a **RustFS 1.0** container (`rustfs/rustfs:1.0.6`), S3 API on 9000,
   internal only (no public hostname, console off), own volume, keys from the
   server `.env`. Added to both delivery compose files, the prod compose, and
   local dev (`fastapi-backend/docker-compose.yml` + `dev.sh`).
4. **Buckets:** `documents` (private) and `photos` (all uploaded images: pets,
   offspring, profile, breedery, services). Created by the backend at startup.
5. **Photos** keep their stored paths as object keys (e.g. `storage/x.jpg`) and are
   served by the backend at the **same `/storage/...` URLs**, with long-lived
   `Cache-Control` so Cloudflare caches them. No frontend URL changes. A CDN can go
   in front later.
6. **Documents** get new private keys; public `/storage/doc_*` URLs stop working.
7. **Chat:** a proper "Documents shared" card with a View button per file, links
   fetched from the backend. Old share messages work (they carry document ids).
8. **Moving existing files** runs automatically at backend startup (single
   uvicorn process), idempotent:
   - documents → `documents` bucket, DB row updated, local copy deleted once the
     upload is confirmed;
   - photos → `photos` bucket, **local copies kept for one release** (rollback
     safety); while they exist, a photo missing from the bucket is served from disk.
9. **Health:** `/health` returns 503 when storage is unreachable, so a deploy fails
   and rolls back. Healthchecks must treat non-200 as failure.
10. **Backups:** prod `deploy.sh` archives the RustFS volume next to the DB dump
    before each backend deploy, with the same retention.
11. **Tests:** an in-memory storage stand-in; pytest never needs RustFS.

## Out of scope

Making photos of unpublished pets private; deleting local photo copies (follow-up
after this release is confirmed); moving data exports into RustFS.

## Known trade-off

A rollback to the previous image serves photos/documents from local disk, so
files uploaded after this release (and all documents) are missing until
redeployed.
