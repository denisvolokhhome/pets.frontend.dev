# 09 — Litter applications, heat history & calendar

**Personas:** Ellie (breeder) in **Browser A**; Sam (pet seeker) in **Browser B**; a second pet seeker, Kim, in a private window.
**Prerequisite:** documents 02–05 (Ellie has a breeding with an application form; Sam has an account).

## A. Open applications for a planned litter

| # | Action | Expected result | Pass |
|---|--------|-----------------|------|
| 1 | Ellie: Breedings → create **Autumn 2027 Goldens**, assign Maple × Cooper. Don't add offspring. Scroll to **Application Form** → **Add Application Form** with two required fields (*Your full name*, *Tell us about your home*) → Save. | The section shows the fields and an **Accept applications for this litter** switch set to **Closed**. | |
| 2 | Turn the switch on. | Toast; badge **Open**; hint "Families can apply from the public litter page, even before puppies are listed." | |
| 3 | Click **Copy link**, paste it in Browser B's address bar. | `/litter/<id>?apply=1` opens. If signed out, the sign-in prompt appears; after signing in as Sam the application form opens. | |
| 4 | Click **View public page** (Browser A). | The public page shows **Planned litter**, "by {breedery}", both parents, "Puppies will be listed here once they arrive…" and, for Ellie, **This is your litter · Manage applications** instead of an Apply button. | |

## B. A family applies before puppies exist

| # | Action | Expected result | Pass |
|---|--------|-----------------|------|
| 5 | Sam: fill both answers (use two lines in the long answer) → **Send application**. | The panel changes to **Application sent — {breedery} will be in touch.** | |
| 6 | Sam: reload and apply again. | Error in the form: "You've already applied. The breeder will be in touch." | |
| 7 | Ellie: reload the breeding page. | **Applications 1**: Sam, today's date, source **Litter**, status **New**. Filter chips show New 1. | |
| 8 | Click **View**. | The original answers, with line breaks kept, plus Submitted / Source. | |
| 9 | Change the status to **Waitlisted**. | Toast "Status updated"; the **Waitlisted** chip shows 1. | |

## C. Puppies arrive, assign one, undo

| # | Action | Expected result | Pass |
|---|--------|-----------------|------|
| 10 | Ellie: **Add Offspring** twice (Sunny, Honey — Available). | Both appear in the Offspring table. | |
| 11 | On Sam's row click **Assign puppy** → pick **Sunny** → **Assign puppy**. | Status **Assigned**, Assigned puppy **Sunny**; Sunny's status in the Offspring table becomes **Reserved**. The status select is disabled with "Undo the assignment first." | |
| 12 | **View** Sam's application again. | Same original answers as step 8. | |
| 13 | **Undo assignment** → confirm. | Status back to **Waitlisted**, Sunny **Available** again. Sam did not have to re-apply. | |
| 14 | Turn **Accept applications** off. | Badge **Closed**; Sam's application is still listed. In Browser B the litter page shows "Applications are closed". | |

## D. The existing puppy application still works; no double assignment

| # | Action | Expected result | Pass |
|---|--------|-----------------|------|
| 15 | Ellie: **Publish** Honey. Kim: open Honey's page → **Apply for Offspring** → fill the form → submit. | Kim lands in a new conversation with the answers prefilled, exactly as before. | |
| 16 | Ellie: reload the breeding page. | Kim's application is listed with source **Puppy: Honey**. | |
| 17 | Assign **Honey** to Kim. Then try to assign **Honey** to Sam. | Kim: Assigned. Sam: Honey is not offered (only Available puppies are listed). If two breeder tabs race, the second gets "That puppy isn't available any more…". | |

## E. Heat history and the calendar

| # | Action | Expected result | Pass |
|---|--------|-----------------|------|
| 18 | Ellie: **Pets** → Maple (female) → droplet **Heat history** icon. Cooper (male) has no such icon. | "Heat History · Maple" opens, private note at the top. | |
| 19 | **Add cycle**: start = 10 days ago, no end, a note → Save. | Banner "In heat since {date} · day 11", the cycle shows an **In progress** badge; **Add cycle** is disabled ("End the current cycle before adding a new one."). | |
| 20 | **Add reminder** for next week with a note. | It appears under Reminders (upcoming first). | |
| 21 | **View in calendar**. | `/calendar?pet=…`, current month, dog filter = Maple. The start day shows a chip **Maple · Heat start** (with ⌛ in progress) and the reminder day **Maple · Reminder**. | |
| 22 | Click the heat start chip → set an end date before the start date → Save. | "End date must be on or after the start date" — not saved. | |
| 23 | Set the end date to yesterday → Save. | Toast; a **Maple · Heat end** chip appears on yesterday. | |
| 24 | Back to Pets → Maple → Heat history. | The same cycle now shows both dates and no In progress badge — the edit made in the calendar is here. | |
| 25 | Calendar → **Add event** with **All dogs** selected, on a clicked day. | The form opens with that date preselected and lets you choose the dog. | |
| 26 | Change your computer's time zone to a far-west zone (e.g. Pacific/Honolulu), reload the calendar and Heat history. | Every date is still on the same day as before. | |
| 27 | Sign in as another breeder and open `/calendar`. | None of Ellie's dogs or events are visible. | |
| 28 | Phone width (390px): open the calendar. | Compact month with dots under event days, legend, and the selected day's list below; no sideways scrolling. Calendar is in the ☰ menu. | |
