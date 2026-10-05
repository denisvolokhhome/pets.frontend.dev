# 03 — Offspring

**Persona:** Ellie (breeder), **Browser A**, signed in.
**Prerequisite:** document 02 (two breedings exist).

## A. Add a litter from the breeding page

| # | Action | Expected result | Pass |
|---|--------|-----------------|------|
| 1 | Breedings → open **Spring 2026 Goldens — Maple x Cooper** → **+ Add Offspring**. | "Add Offspring" dialog. Breed is prefilled (*Golden Retriever*, read-only). | |
| 2 | Add **Sunny**: born `07/20/2026`, **Male**, status Available, price `2500`, color `Light gold`, description `Playful and well socialized.` Save. | Toast "Offspring added successfully". | |
| 3 | Add **Honey**: `07/20/2026`, Female, **Reserved**, `2800`, `Dark gold`. | Same. | |
| 4 | Add **Biscuit**: `07/20/2026`, Male, Available, `2500`, `Cream`. Under **Photos** click **Add photos** and pick `offspring-biscuit.jpg` and `offspring-honey.jpg`. | Both previews appear, the first labelled **Main**; × removes one. After Save: toast "Offspring added successfully"; Biscuit's page shows `offspring-biscuit.jpg` as the main photo. | |
| 4a | Open **Add Offspring** again, click **Add photos** and select 6 images. | Only 5 are kept, with a "You can add up to 5 photos." warning; the **Add photos** tile disappears at 5. Cancel. | |
| 5 | Look at the Offspring table on the breeding page. | 3 rows: **name is a link**, gender with icon, Born `Jul 20, 2026` (**not Jul 19**), Status badge (Available green / Reserved amber), Price `$2,500`. | |

## B. Photos & publishing

| # | Action | Expected result | Pass |
|---|--------|-----------------|------|
| 6 | Click **Sunny**. | Breeder view of Sunny: title **Sunny** (large, bold), header actions **Publish · Edit · Convert to Pet · Delete**. Visibility badge **Unpublished** (small grey pill, not full-width). | |
| 7 | **Edit** → add photos `offspring-sunny.jpg` and `offspring-cocoa.webp` → **Save**. | Toast "Offspring updated successfully". Main photo + 2 thumbnails + **View Gallery (2)**. | |
| 8 | Click **Publish**. | Toast "Published — Offspring is now visible to pet seekers." Badge turns green **Published**; the button becomes **Unpublish**. | |
| 9 | Check **Engagement**. | Favorites `0` and Conversations `0` (both show a number). | |
| 10 | Check **Record Information**. | Created / Last Updated dates and **Offspring ID** (visible to the breeder only). | |
| 11 | Publish **Honey** the same way (add `offspring-honey.jpg` first) and **Biscuit** (already has photos). | Same as steps 7–8. | |
| 12 | For the **Hazel x Bentley** breeding add **Shadow** (Male, `08/30/2026`, Available, `1800`, Black, photo `offspring-shadow.jpg` added right in the Add Offspring dialog) and **Cocoa** (Female, `08/30/2026`, Available, `1900`, Chocolate, photo `offspring-cocoa.webp`). Publish both. | Same as above. | |

## C. Offsprings list

| # | Action | Expected result | Pass |
|---|--------|-----------------|------|
| 13 | Open **Offsprings** (left menu). | Table with all 5: photo, Name + "♀ Female · Golden Retriever · Dark gold", Status, Born + age (`10 weeks`), Price, Parents (`Maple × Cooper`, "Breeding #N" link), Activity (♡ and 💬 counts), Actions (Edit, Documents, Delete). **No sideways scrolling.** | |
| 14 | Hover a long Parents value (Hazel × Bentley Sir…). | Full text in a tooltip; the cell shows "…". | |
| 15 | Click **Filters** → Status **Reserved**. | Only Honey. Clear the filter. | |
| 16 | Click an offspring's **Delete** (trash) then **Cancel** in the dialog. | In-app dialog "Delete offspring?" with **Cancel** focused; Cancel keeps the row. | |
| 17 | Open **Genealogy** again. | Each family now shows "3 offsprings" / "2 offsprings". | |
