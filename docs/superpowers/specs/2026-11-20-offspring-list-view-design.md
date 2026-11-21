# Map search: "Offspring" list view grouped by breeder

Spans `pets.backend.dev` and `pets.frontend.dev`. Approved 2026-11-20.

## Why

Map search shows breeders (map + breeder cards). Seekers who just want to browse the
puppies available near them have to open breeders one by one. A third view lists the
available offspring directly, grouped by breeder, with the distance on every card.

## Design

- **View switch.** Desktop: **Map | Offspring** above the results. Mobile: a third tab
  next to Map and Results. The Offspring view is full width with no map. The chosen view
  is saved with the rest of the search state.
- **Grouping.** Breeders are sorted nearest first. Each group has a header (photo, name,
  `~N mi`, rating, "N available", Profile / Contact) followed by a grid of that breeder's
  puppies, newest first.
- **Cards.** The existing `app-offspring-card` with a new optional `distance` input,
  shown as a `~N mi` badge. Tapping a card opens `/offspring/:id`.
- **Filters.** The same search drives this view: centre (ZIP or geolocation), radius,
  breed (a strict filter here) and animal kind. Only Available, published offspring of
  active breeders with a published breeding location inside the radius are shown. The
  "Has offspring" chip is hidden in this view.
- **Paging.** 10 breeders per page, with **Load more**.
- **Distance.** It is per breeder (their nearest published location) and rounded to whole
  miles (at least 1), like the rest of the public map.

## Backend

`GET /api/search/offsprings?latitude&longitude&radius&breed_id?&animal_kind?&limit=10&offset=0`
→ `{ groups: [{ breeder_id, breeder_name, thumbnail_url, distance, rating, review_count,
available_count, offsprings: OffspringRead[] }], total_breeders, limit, offset }`.
`limit` can be 1–30. The "nearest location per breeder" subquery is shared with
`/api/offsprings/public/nearby`.

## Approaches considered

- Server-side grouping and paging by breeder (**chosen**).
- The browser fetching each breeder's offspring: N requests, slow, and paging is awkward.
