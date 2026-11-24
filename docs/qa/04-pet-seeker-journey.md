# 04 — Pet seeker journey

**Persona:** Marcus Reed, looking for a family dog.
**Browser B** (a different browser or a private window — keep Ellie signed in on Browser A).
**Prerequisite:** documents 01–03 (Sunny Meadow Retrievers has published offspring).

## A. Sign up

| # | Action | Expected result | Pass |
|---|--------|-----------------|------|
| 1 | Open the home page. **Get Started → I'm a Pet Seeker**. | Sign-up form at step 2, stepper shows **Pet Seeker ✓**. A **Continue with Google** option is shown below the form. | |
| 2 | Also open `/register/pet-seeker` directly. | Redirects to the same form (old link still works). | |
| 3 | Fill Marcus Reed, your Marcus email, `Seeker2026!` twice, accept terms, **Create Account**. | "Check your email" page. | |
| 4 | Open the verification email, click the link. | Signed in; **Pet Seeker Dashboard** with "Welcome, Marcus Reed!", cards **Unread Messages 0** and **Favorites 0**. Left menu: Dashboard, Messages, Favorites. | |

## B. Search

| # | Action | Expected result | Pass |
|---|--------|-----------------|------|
| 5 | Click the map icon in the top bar (or **Find Your Pet** on home). | Map search page. One search row: 🐾 (with the "Find Breeders" title on wide screens), ZIP, Breed, **Dog** / **Cat** / **Has offspring** chips, the 10/20/40/60 mi group, the **Map / Offspring** switch and **Search** on the right. No sideways scrolling, nothing clipped, at any desktop width. | |
| 6 | ZIP `21701`, radius **40 mi**, **Search**. | Toast "Found N breeders" (**no** mention of service providers). Map pins + list. **Sunny Meadow Retrievers** is listed with its logo and breeds. | |
| 7 | Filter by the **Dog** / **Cat** chips in the search row (on mobile: the chips above the results list). | List updates accordingly. | |
| 7a | Look at the **Offsprings** link on each card. | Shows the number of available offspring, e.g. **Offsprings · 5** for Sunny Meadow. A breeder with none shows **Offsprings · 0**, greyed out and not clickable. | |
| 7c | Click **Offspring** in the Map / Offspring switch (on mobile: the **Offspring** tab). | The map is replaced by a full-width list: "N available offspring from M breeders near you", then each breeder (nearest first) as a card with **Profile**, **Contact** and "N available", followed by their puppies. Every puppy card shows **~N mi away**. Reserved / Sold puppies are not listed; breeders with nothing available don't appear. **Dog** / **Cat** and the breed box filter the list. With more than 10 breeders, **Load more breeders** appends the next ones. Switching back to **Map** shows the map and pins again; a page refresh keeps the chosen view. | |
| 7d | Signed out, click a breeder's map pin → **Contact** in the popup. Sign in as the pet seeker in the prompt. Then sign in as a breeder and open a popup. | Signed out: the sign-in prompt; after signing in you land in a new conversation with that breeder. As a breeder: the popup has no **Contact** button. |
| 7b | Click the **Has offspring** chip in the search row (on mobile: Filters → Availability → **Only breeders with offspring** → Search). | Breeders with 0 available offspring disappear; click again to bring them back. The choice survives going to a puppy page and back. | |

## C. Breeder profile

| # | Action | Expected result | Pass |
|---|--------|-----------------|------|
| 8 | On Sunny Meadow's card click **Profile**. | Popup shows: logo, name, **Frederick, Maryland**, the description, the 4 tags, **Animals: Dogs**, **Breeds**: Beagle, Golden Retriever, Labrador Retriever, **View Offsprings**, Reviews ("No reviews yet" for now). No blank sections. | |
| 9 | Click **View Offsprings**. | A pop-up opens **over the map** (bottom sheet on mobile) titled "Offspring from Sunny Meadow Retrievers": the 5 published offspring with photos, status, age, gender, breed, price formatted `$2,500`; gender / "Available only" filters at the top. | |
| 9a | Scroll the pop-up down. | **More near you**: a sideways row of available puppies from *other* breeders in the search area, each with price, name · breed, breeder name · `N mi`. Same breed first. Hidden if there are none. | |
| 9b | Press **Esc** (mobile: swipe the sheet down). | Pop-up closes; the map, list, filters and scroll position are exactly as before. | |
| 9c | With a breeder that has a location phone and **Show phone number to pet seekers** on (Settings → Locations), search again. | Card and Profile pop-up show the phone; tapping it starts a call. With the switch off, no phone appears anywhere. | |

## D. Offspring listing & favorites

| # | Action | Expected result | Pass |
|---|--------|-----------------|------|
| 10 | Click **Sunny**. | Public page: photos + gallery, Basic Information, Lineage (Father Cooper, Mother Maple), **Listed by Sunny Meadow Retrievers** with the logo. **No "Offspring ID"** shown. Header buttons **Add to Favorites** and **Apply for Offspring** (Sunny's breeding has an application form). | |
| 11 | Click **Add to Favorites**. | Toast "Added to favorites"; button becomes **Favorited** with a coral heart. | |
| 12 | Open **Favorites** (left menu). | Sunny is listed. "Breeders You're Following" shows **Sunny Meadow Retrievers** (not "Breeder"). | |
| 13 | Type `labrador` in the Favorites search, then `sunny`. | `labrador` → no cards; `sunny` → Sunny. | |
| 14 | Open the **Dashboard**. | **Favorites 1**. | |

## Extra checks (UX pass)

| # | Action | Expected result | Pass |
|---|--------|-----------------|------|
| X1 | As a guest on any page, look at the top bar. | **Find a pet** link to the map (hidden on the map itself). | |
| X2 | Open the map and decline location access. | A neutral note: "Enter your ZIP code to see breeders and puppies near you." (no warning colours). | |
| X3 | A breeder without a kennel name. | Shown under their own name (or "Breeder"), never a placeholder joke. | |
| X4 | Offspring view → scroll down → open a puppy → **Back**. | Same breeders loaded and the same scroll position. A new search starts at the top. | |
| X5 | Puppy whose litter has an application form. | **Message breeder** next to **Apply for Offspring**; no "Record Information" for seekers. | |
| X6 | Contact a breeder. | The message screen says "New message to <breeder>" with **View their offspring**. | |

