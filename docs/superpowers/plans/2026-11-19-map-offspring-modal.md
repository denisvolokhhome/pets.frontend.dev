# Map offspring modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Offspring list opens in a modal over the map with "More near you" suggestions; breeder cards show available-offspring count; map filter for breeders with offspring; optional public phone per location; fix Contact vanishing after sign-in.

**Architecture:** Backend adds columns to `locations`, extends `/api/search/breeders` (count, phone, `has_offspring`) and adds `/api/offsprings/public/nearby`. Frontend wraps the existing `OffspringGridComponent` (embedded mode) in a new `BreederOffspringModalComponent` hosted by the breeder card.

**Tech Stack:** FastAPI + async SQLAlchemy + PostGIS + Alembic; Angular 21 (NgModule), Karma/Jasmine.

**Spec:** `docs/superpowers/specs/2026-11-19-map-offspring-modal-design.md` (frontend repo)

## Global Constraints

- Branch `feature/map-offspring-modal` in both repos, off `develop`.
- Count = offspring with `status='Available'` and `is_published=true`, per breeder (user), across all locations.
- `phone` max 32 chars, allowed chars digits, spaces, `+()-.`; `show_phone` default false. Hidden phone never in API output to the public.
- Nearby distances in whole miles (>= 1); `limit` default 12, max 24.
- Frontend: use design tokens / `ui-btn` classes; works at 390px.

## Review Focus

1. Breeder with offspring but no published location → never appears in nearby suggestions.
2. Breeder with two locations in radius → their offspring appear once in nearby (nearest location).
3. `show_phone=true` but empty phone → `phone` is null, no empty `tel:` link.
4. Modal opened, then closed → search results and scroll intact; body scroll restored.
5. Archived / unpublished / Reserved offspring → not counted, not suggested.

---

### Task 1 (backend): location phone fields

**Files:** `app/models/location.py`, `app/schemas/location.py`, new `alembic/versions/q4r5s6t7u8v9_add_location_phone.py`, test `tests/integration/test_location_endpoints.py`

- [ ] Test: create location with `phone="+1 (512) 555-0100", show_phone=true` → read back both; invalid `phone="abc"` → 422.
- [ ] Add `phone: Optional[str] (String(32))`, `show_phone: bool (server_default 'false')` to model; `phone`/`show_phone` to `LocationBase` (optional / default False) and `LocationUpdate`.
- [ ] Migration with `down_revision` = current head (`alembic heads`).
- [ ] Run tests, commit `feat(locations): optional public phone number`.

### Task 2 (backend): search count, phone, has_offspring

**Files:** `app/services/breeder_service.py`, `app/schemas/breeder.py`, `app/routers/search.py`, test `tests/integration/test_map_offspring_search.py`

**Produces:** `BreederSearchResult.available_offspring_count: int`, `.phone: Optional[str]`; query param `has_offspring: bool = False`.

- [ ] Tests: count = 2 with 2 Available+published, 1 Reserved, 1 unpublished; `has_offspring=true` excludes a breeder with 0; phone returned only when `show_phone`.
- [ ] Implement via an offspring-count subquery grouped by `user_id`, outer-joined on `Location.user_id`; filter `> 0` when `has_offspring`.
- [ ] Commit `feat(search): offspring count, public phone, has_offspring filter`.

### Task 3 (backend): nearby offspring endpoint

**Files:** `app/services/offspring_service.py` (`list_nearby_public_offsprings`), `app/routers/offsprings.py` (route before `/public/{offspring_id}`), `app/schemas/offspring.py` (`NearbyOffspringRead(OffspringRead)` + `breeder_name: str`, `distance: float`; `NearbyOffspringListResponse{offsprings}`), test `tests/integration/test_nearby_offsprings.py`

**Produces:** `GET /api/offsprings/public/nearby?latitude&longitude&radius&exclude_breeder_id?&breed_id?&limit=12`.

- [ ] Tests: excludes `exclude_breeder_id`; excludes outside radius / unpublished location / Reserved; same-breed first then distance; breeder with two locations appears once.
- [ ] Implement: per-user min distance subquery over published `user` locations with `ST_DWithin`; join offspring; order `(breed_id == breed_id) desc, distance, created_at desc`; build items with `_build_offspring_response` + extra fields.
- [ ] Commit `feat(offsprings): nearby public offspring suggestions`.

### Task 4 (frontend): models, services, location settings

**Files:** `models/search.ts`, `services/search.service.ts` (`searchBreeders(..., hasOffspring?: boolean)`), `services/offspring.service.ts` (`getNearbyOffsprings(params): Observable<NearbyOffspring[]>`), `components/settings/breeding-locations/*`, location model in `services/data.service.ts` / `models`.

- [ ] Phone input + "Show phone number to seekers" checkbox in the form; patch on edit.
- [ ] Build passes; commit `feat(locations): phone and show-phone setting`.

### Task 5 (frontend): breeder card + offspring modal

**Files:** new `components/breeder-offspring-modal/*` (declared in `app.module.ts`), `components/offspring-grid/*` (`@Input() embedded = false` hides the mobile breeder bar and back button; `@Output() contact`), `components/breeder-card/*`, `components/breeder-card-list/*` + `search-page` pass `searchCenter`, `searchRadius`, `searchBreedId` inputs down.

**Interfaces:** `BreederOffspringModalComponent` inputs `breederId`, `breederName`, `center: Coordinates`, `radius: number`, `breedId?: number`; output `closed`.

- [ ] Spec `breeder-offspring-modal.component.spec.ts`: renders "More near you" with items from mocked service; hides strip when empty; Escape emits `closed`.
- [ ] Card: "Offsprings · N", disabled when 0; phone `tel:` link when present (card + profile pop-up); profile "View Offsprings" opens the modal.
- [ ] Commit `feat(search): offspring modal with nearby suggestions`.

### Task 6 (frontend): has-offspring filter + contact-after-sign-in bug

- [ ] "With offspring" pill in the animal-kind row and the mobile drawer; `onlyWithOffspring` persisted in `search_page_state`; counts in `hasActiveFilters`.
- [ ] Reproduce Contact disappearing after guest sign-in in the browser; fix root cause.
- [ ] Privacy policy line on public phone; update map QA script in `docs/qa/`.
- [ ] `npx ng build` and targeted specs pass; commit.
