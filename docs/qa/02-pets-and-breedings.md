# 02 — Pets & breedings

**Persona:** Ellie (breeder), **Browser A**, signed in.
**Prerequisite:** document 01 completed (profile + default location exist).

## A. Add pets with photos

| # | Action | Expected result | Pass |
|---|--------|-----------------|------|
| 1 | Open **Pets**. | Empty state. A **+ Add Pet** primary button (with a ▾ menu) in the header. | |
| 2 | Click **Add Pet**. | "Add New Pet" dialog. **Location** is preselected to *Sunny Meadow Farm*. **Save** is disabled. | |
| 3 | Fill: type **Dog** (the tile gets a coral border), name `Maple`, breed: type `Golden` and pick **Golden Retriever**, birth date `04/12/2021`, gender **Female**, weight `29.5`, photos `pet-maple-1.jpg` + `pet-maple-2.png`, description `Sweet, calm and great with kids.`, tick **Vaccinated** and **Health Certificate**. | Two photo thumbnails appear. **Save** becomes enabled. | |
| 4 | Click **Save**. | Dialog closes **without the page reloading**. Toast "Maple was added to your pets". Maple's card appears with her photo. | |
| 5 | Repeat for **Cooper** (Golden Retriever, Male, `09/03/2020`, `34`, photos `pet-cooper-1.jpg` + `pet-cooper-2.png`, Vaccinated + Dewormed + Birth Certificate). | Same as step 4. In the new dialog the location is preselected again. | |
| 6 | Repeat for **Hazel** (Labrador Retriever, Female, `01/20/2022`, `27`, photo `pet-hazel-1.jpg`, Vaccinated). | Same as step 4. | |
| 7 | Repeat for **Bentley Sir Fluffington III** (Labrador Retriever, Male, `06/15/2019`, `36.2`, photos `pet-bentley-1.jpg` + `pet-bentley-2.png`, Vaccinated + Health Certificate). | Same as step 4. | |
| 8 | Look at the 4 cards. | Each card: photo, name (long names end with "…" — no overflow), gender icon, **breed**, date `Jun 15, 2019 · 7 years 4 months`-style, location, green health badges. | |
| 9 | Hover a card. | A white toolbar appears on the photo: Edit, Quick breeding, Documents, Delete (all same style). | |

## B. Table view

| # | Action | Expected result | Pass |
|---|--------|-----------------|------|
| 10 | Click the **table** icon next to the search box. | Table with columns: photo, Name (with gender · breed under it), Born (with age), Weight (`kg`), Location, Health, Actions. **No sideways scrollbar** on a laptop screen. | |
| 11 | Click the **Name** header twice. | Sorts A→Z then Z→A. | |
| 12 | Check the footer. | "Showing 1 to 4 of 4 pets", page buttons, a rows-per-page selector. Opening the selector shows **10 / 25 / 50 / 100** and they are clickable. | |
| 13 | Click **Filters**. Choose Gender **Female**. Close the panel. | Panel slides in from the left; the table shows only Maple and Hazel; the Filters button shows a **1** badge. | |
| 14 | Open Filters → clear filters. | All 4 pets again. | |

## C. Edit a pet

| # | Action | Expected result | Pass |
|---|--------|-----------------|------|
| 15 | Edit **Hazel**: add photo `pet-hazel-2.png`, tick **Dewormed**, Save. | Toast "Hazel was updated". Card shows the Deworm badge. | |
| 16 | Re-open Hazel's edit and delete the new photo (trash icon on the photo). | An **in-app** confirmation dialog "Delete photo?" (not a browser pop-up). Confirm → photo removed. | |

## D. Pet documents

| # | Action | Expected result | Pass |
|---|--------|-----------------|------|
| 17 | On Maple's card click **Documents**. Upload `vet-certificate.pdf`. | File listed with its size; counter shows `1/10 documents`. | |
| 18 | Upload `oversized-12mb.png`. | Error toast "File size must be under 10MB." Nothing added. | |
| 19 | Delete the PDF. | In-app dialog "Delete document?" appears **above** the documents window. Confirm → removed. Re-upload the PDF afterwards. | |

## E. CSV import (plan limit: Free = 5 pets)

| # | Action | Expected result | Pass |
|---|--------|-----------------|------|
| 20 | Pets → **▾** next to Add Pet → **Import CSV**. | Wizard step 1/3. "Available Breeds (588)" shows ~24 chips, a search box and **Show all 588 breeds**. | |
| 21 | Type `lab` in the breed search. | Only matching breeds (e.g. *Labrador Retriever*). | |
| 22 | **Next** → upload `pets-import-with-errors.csv`. | Preview with 4 rows. Errors listed per row, each starting "Row N:" once: row 1 name required; row 2 **unknown breed "Not A Real Breed"**; row 3 gender, negative weight, **date of birth in the future**. Row 4 (Valid Vera) is importable. | |
| 23 | Upload `pets-import-valid.csv` instead. | Notice: "Your plan allows 5 pets. You currently have 4." Button reads **Import 1 pet**. | |
| 24 | Click **Import 1 pet**. | Results: **1 Pet created**, **2 Rows not imported**, plus a notice that 2 valid rows were left out because of the plan limit. The pets list now has 5 pets. | |

## F. Breedings

| # | Action | Expected result | Pass |
|---|--------|-----------------|------|
| 25 | Open **Breedings** → **+ Add Breeding**. | "Quick Breeding" dialog asks to **Select the first parent**, listing your pets (name, gender · breed). | |
| 26 | Pick **Maple**. | Maple appears at the top; list title "Select **Male** Partner" shows only male pets, each with breed. | |
| 27 | Pick **Cooper** → **Next** → description `Spring 2026 Goldens — Maple x Cooper` → **Create**. | Toast "Breeding Created Successfully"; you land on the new breeding's detail page. | |
| 28 | Go to **Pets**, hover **Hazel** → **Quick breeding**, pick **Bentley**, description `Summer 2026 Labs — Hazel x Bentley`, create. | Same result; this checks the second way to start a breeding. | |
| 29 | Open **Breedings**. | Table: Breeding (description + breed), Location, Offspring, Status badge **In Process**, Created date. Actions: Edit (pencil), Void (red on hover). All columns visible without scrolling. | |
| 30 | Click the Maple × Cooper description. | Opens the breeding detail (same as double-click). | |

## G. Application form (on the Maple × Cooper breeding)

| # | Action | Expected result | Pass |
|---|--------|-----------------|------|
| 31 | On the breeding detail click **Add Application Form**. | "Application Form Builder" dialog. | |
| 32 | Add **Short text** `Do you have a fenced yard?`, **Long text** `Tell us about your home and other pets`, **Short text** `Preferred pick-up month`. Turn **Required** on for the first two. **Save Form**. | Toast "Application form saved." Summary lists the 3 questions with types **Short text / Long text** (not "text/textarea") and "Required" on the first two. | |

## H. Genealogy

| # | Action | Expected result | Pass |
|---|--------|-----------------|------|
| 33 | Open **Genealogy**. | Two family groups (Cooper + Maple, Bentley + Hazel) with their **photos**, breeds, birth dates, and an "N offsprings" link (after doc 03). Zoom +/− works. | |
