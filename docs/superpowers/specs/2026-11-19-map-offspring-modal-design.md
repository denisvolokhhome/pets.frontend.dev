# Map: offspring modal, nearby suggestions, location phone, offspring count

Spans `pets.backend.dev` and `pets.frontend.dev`.

## Why

On the map, a seeker who taps **Offsprings** on a breeder card is sent to a separate
page and loses their place on the map. If that breeder has nothing they like (or
nothing at all), they have to navigate back and start again. The goal is to keep the
seeker browsing on the map, Marketplace-style: look at a breeder's offspring in a
pop-up, see similar offspring from other breeders nearby, close it and carry on.
Seekers should also see at a glance whether a breeder has anything available, and
breeders should be able to share a phone number if they want to.

## Goals

1. **Offspring pop-up.** Tapping *Offsprings* on a breeder card (or *View Offsprings*
   in the profile pop-up) opens the breeder's offspring list in a modal over the map.
   Closing it leaves the map, list, scroll position and filters untouched.
2. **"More near you"** inside that pop-up: available offspring from *other* breeders
   within the current search radius, so the seeker can keep looking at similar options.
3. **Offspring count on the breeder card** ("Offsprings · 3"); greyed out at 0.
4. **Map filter** "Only breeders with available offspring".
5. **Location phone.** Optional phone number per location plus a "Show phone number to
   seekers" switch (default off). Shown on the breeder card / profile pop-up when on.
6. **Bug:** after a guest taps Contact, signs in from the prompt, and returns, the
   Contact link disappears. Reproduce and fix the real cause.

## Non-goals

- No "allow contact without offspring" setting. Contact already shows for guests and
  pet seekers regardless of offspring; that behaviour stays as is.
- Puppy details stay on their own page (`/offspring/:id`). Tapping a puppy in the
  modal (breeder's own or a suggestion) navigates there, as today.
- The `/breeder/:id/offsprings` page stays so existing links keep working.
- No changes to breeders contacting breeders.

## Anti-goals

- A hidden phone number must never reach the browser (filter server-side).
- Suggestions must not leak exact breeder locations (use the same approximate
  distance rounding the map search already uses).

## Approaches considered

- **Suggestions source.** (a) New backend endpoint returning nearby available
  offspring in one query — **chosen**. (b) Browser fetches each nearby breeder's
  offspring one by one — rejected: dozens of requests, slow, hard to rank.
- **Modal content.** (a) Reuse `OffspringGridComponent` inside a modal shell, with an
  `embedded` mode that hides page-only chrome (back bar) — **chosen**. (b) Build a new
  list component — rejected: duplicates filters, pagination, waitlist button.
- **Puppy details in modal vs. own page.** User chose: own page.

## Design

### Backend (`pets.backend.dev/fastapi-backend`)

- `locations` gets `phone` (nullable string, 32) and `show_phone` (bool, default
  false). Alembic migration; location create/update/read schemas updated; owner
  endpoints accept and return both.
- `GET /api/search/breeders`:
  - each result gains `available_offspring_count` — the breeder's (user's) offspring
    with `status='Available'`, `is_published=true`, counted across all their locations
    (offspring belong to a user, not a location);
  - each result gains `phone`, populated only when the location's `show_phone` is true;
  - new query param `has_offspring: bool = false`; when true, only breeders with
    `available_offspring_count > 0` are returned.
- New `GET /api/offsprings/public/nearby` with `latitude`, `longitude`, `radius`,
  `exclude_breeder_id`, optional `breed_id`, `limit` (default 12). Returns available,
  published offspring of active breeders with a published `user` location within the
  radius, excluding `exclude_breeder_id`. Ordered: matching `breed_id` first, then by
  distance. Each item uses the existing public offspring shape plus breeder name and
  approximate distance in whole miles.
- Tests for the new count, filter, phone hiding and nearby endpoint.

### Frontend (`pets.frontend.dev`)

- `BreederSearchResult` gains `available_offspring_count` and `phone`.
- **Settings → Locations:** phone input + "Show phone number to seekers" toggle.
- **Breeder card:** Offsprings button shows the count and is disabled at 0; phone
  shown as a `tel:` link when present (card and profile pop-up).
- **Offspring modal:** new modal component hosted by the breeder card (same pattern as
  the profile pop-up, incl. mobile drag-to-dismiss), containing
  `OffspringGridComponent` in embedded mode, then a horizontal **"More near you"**
  strip of `app-offspring-card`s from the nearby endpoint (search centre and radius
  come from the current map search; breed = the search's breed filter if set). Strip
  hidden when empty. Escape / backdrop / close button close it.
- **Search controls:** "Only breeders with available offspring" checkbox, passed as
  `has_offspring`, persisted with the rest of the search state.
- **Bug fix** for Contact disappearing after sign-in.
- **Legal/QA:** privacy policy mentions the optional, breeder-controlled public phone
  number; update the relevant `docs/qa/` script for the map → offspring flow.
- Work on `feature/map-offspring-modal` branches in both repos, merged into `develop`.

## Builder's calls (marked as such)

- Count = Available only (not Reserved/Sold).
- Suggestions default limit 12; breed preference = search's breed filter, else the
  breeds the viewed breeder has listed.
- Phone is free text, validated loosely (digits, spaces, `+()-`), max 32 chars.
