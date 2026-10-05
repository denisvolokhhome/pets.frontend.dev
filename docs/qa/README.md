# Breedly — Happy-Path Test Suite

These documents walk a tester through every main workflow in Breedly, end to end, the way a real
breeder and a real pet seeker would use it. Run them **in order** — later documents reuse the
accounts and data created in earlier ones.

| # | Document | What it covers | Time |
|---|----------|----------------|------|
| 1 | [01-breeder-onboarding.md](01-breeder-onboarding.md) | Breeder sign-up, email verification, breedery profile, location, account settings | 20 min |
| 2 | [02-pets-and-breedings.md](02-pets-and-breedings.md) | Pets with photos & documents, CSV import, breedings, application form, genealogy | 35 min |
| 3 | [03-offspring.md](03-offspring.md) | Offspring: add, photos, publish, list/table views | 20 min |
| 4 | [04-pet-seeker-journey.md](04-pet-seeker-journey.md) | Pet seeker sign-up, map search, breeder profile, listings, favorites | 20 min |
| 5 | [05-messaging-and-reviews.md](05-messaging-and-reviews.md) | Contact & apply, conversations both ways, notifications & emails, location sharing, reviews | 30 min |
| 6 | [06-account-and-security.md](06-account-and-security.md) | Guest → account flow, password reset, sign-in redirects, session expiry, logout | 20 min |
| 7 | [07-subscription-billing.md](07-subscription-billing.md) | Plan limits, upgrade with Stripe test card | 15 min |
| 8 | [08-mobile-checklist.md](08-mobile-checklist.md) | The key screens again on a phone-sized screen | 20 min |

---

## Before you start

### Environment
- **App URL:** the environment you were given (e.g. `https://dev.breedly.us`).
- **Email inbox:** registration, verification, password reset and new-message emails are real
  emails. On test environments they are captured by the team's mail catcher (Mailpit, usually at
  `http://<env-host>:8025`). Ask the dev team if you don't know where emails land.
- **Payments:** Stripe runs in **test mode**. Never use a real card. Use the test card below.
- **Two browsers:** messaging tests need a breeder and a pet seeker signed in **at the same time**.
  Use two different browsers (e.g. Chrome + Firefox) or a normal window + a private/incognito
  window. One browser profile can only be signed in as one user.

### Test accounts (create them in documents 1, 4 and 6)
Use a unique suffix per test run (e.g. today's date) so accounts don't collide: `+0412` below.

| Persona | Name | Email | Password |
|---------|------|-------|----------|
| Breeder | Ellie Harper | `ellie.harper+0412@<your-test-domain>` | `Breeder2026!` (changed to `NewBreeder2026!` in doc 1) |
| Pet seeker | Marcus Reed | `marcus.reed+0412@<your-test-domain>` | `Seeker2026!` |
| New visitor | Jordan Lee | `jordan.lee+0412@<your-test-domain>` | `Jordan2026!` (reset to `Reset2026!x` in doc 6) |

> On dev/staging (`ENVIRONMENT` is not `production`) addresses on `.test` domains work everywhere,
> including Forgot password. In **production** reserved domains (`.test`, `.local`, `.invalid`…)
> are rejected at sign-up with "Please enter a valid email address." — use a real mailbox there.

### Stripe test card
| Field | Value |
|-------|-------|
| Card number | `4242 4242 4242 4242` |
| Expiry | any future date, e.g. `12 / 34` |
| CVC | any 3 digits, e.g. `123` |
| ZIP | `21701` |

### Test files
All files are in [`assets/`](assets/). Use them exactly as named so screenshots and expectations match.

| File | Used for |
|------|----------|
| `breedery-logo.png` | Breedery logo / profile image |
| `pet-maple-1.jpg`, `pet-maple-2.png` | Pet "Maple" photos |
| `pet-cooper-1.jpg`, `pet-cooper-2.png` | Pet "Cooper" photos |
| `pet-hazel-1.jpg`, `pet-hazel-2.png` | Pet "Hazel" photos |
| `pet-bentley-1.jpg`, `pet-bentley-2.png` | Pet "Bentley Sir Fluffington III" photos |
| `offspring-sunny.jpg`, `offspring-honey.jpg`, `offspring-biscuit.jpg`, `offspring-shadow.jpg` | Offspring photos (JPEG) |
| `offspring-cocoa.webp` | Offspring photo (WebP format check) |
| `vet-certificate.pdf` | Pet / offspring document upload |
| `pets-import-valid.csv` | CSV import — 3 valid rows |
| `pets-import-with-errors.csv` | CSV import — rows with deliberate errors |
| `invalid-type.gif` | Negative test: wrong image type for logos |
| `oversized-12mb.png` | Negative test: file over the size limit. **Not in git** — generate it with `python3 assets/make_oversized.py` |

### Address used for the breeding location
`100 W Patrick St, Frederick, Maryland 21701, United States` — a real address, so geocoding and
the map search (ZIP `21701`) work.

---

## How to record results

Each document is a table of steps. For every step:
1. Do exactly what the **Action** column says.
2. Compare with **Expected result**.
3. Mark **Pass** ✅ or **Fail** ❌. On a fail, note what you saw, take a screenshot, and keep
   going if you can.

General expectations that apply to **every** step (report any violation as a bug):
- No browser `alert()` / `confirm()` pop-ups — all confirmations are in-app dialogs.
- Every save shows feedback (a toast in the top-right, or an inline message).
- Form errors are shown next to the field that is wrong, not only as a generic toast.
- Dates read like `Oct 4, 2026`; prices like `$2,500`.
- Nothing is cut off or overlaps; no sideways scrolling on the page (tables may scroll inside
  their own box on phones).
- The browser console (F12 → Console) shows no red errors except `401` on pages you visit while
  signed out.

Bug report template:

```
Title:      <what is wrong, in one line>
Doc/Step:   05 / step 12
Account:    marcus.reed+0412@...
Browser:    Chrome 129, macOS (or device + OS for mobile)
Steps:      1. ... 2. ... 3. ...
Expected:   ...
Actual:     ...
Attachments: screenshot, console errors
```
