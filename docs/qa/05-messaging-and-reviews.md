# 05 — Messaging, notifications & reviews

**Personas:** Marcus on **Browser B**, Ellie on **Browser A** — both signed in.
**Prerequisite:** documents 01–04.

## A. Apply for an offspring (application form)

| # | Who | Action | Expected result | Pass |
|---|-----|--------|-----------------|------|
| 1 | Marcus | Open **Honey** (from Sunny Meadow's offspring) → **Apply for Offspring**. | Dialog "Apply for Honey" with Ellie's 3 questions; the first two marked **\***. | |
| 2 | Marcus | Click **Submit & Message Breeder** with everything empty. | Errors: "Do you have a fenced yard?" is required, "Tell us about your home…" is required. | |
| 3 | Marcus | Answer: `Yes — 6ft fence around the whole backyard` / `Two kids (8 and 11) and a cat. We work from home.` / `November`. Submit. | Messaging screen opens. The message box is pre-filled with the answers **on separate lines** (no `**` symbols) and grows to fit. | |
| 4 | Marcus | Reload the page. | The pre-filled text is **not** re-inserted after reload (the URL no longer contains it). | |
| 5 | Marcus | Re-apply (steps 1–3) and click **Send**. | Message bubble shows the answers line by line. The **Conversations** list on the left updates immediately with the conversation. No "Message sent" toast (the bubble is the confirmation). | |

## B. Contact without a form

| # | Who | Action | Expected result | Pass |
|---|-----|--------|-----------------|------|
| 6 | Marcus | Open **Shadow** → **Contact Breeder** (Shadow's breeding has no form). | Messaging screen with Shadow's details panel (photo, status, breed, gender, age, price `$1,800`). | |
| 7 | Marcus | Type `Is Shadow good with other dogs?`, press **Shift+Enter**, type `We have a 3-year-old Lab mix.` Press **Enter**. | Enter sends; Shift+Enter made a new line inside the same message. | |

## C. Breeder side — notifications, email, reply

| # | Who | Action | Expected result | Pass |
|---|-----|--------|-----------------|------|
| 8 | Ellie | Look at the bell icon and the dashboard. | Bell shows a count; dashboard **Unread Messages** matches. | |
| 9 | Ellie | Check Ellie's email inbox. | An email **"New message about offspring — Breedly"** per new conversation, with a **Read message** button and "You can turn these emails off in Settings → Notifications". | |
| 10 | Ellie | Click the bell → click "Marcus Reed sent you a message about Honey". | Opens **that conversation directly** (not just the inbox list). The application answers are readable line by line. Honey's details panel on the right. | |
| 11 | Ellie | Reply: `Honey is reserved, but we have a waitlist.` Shift+Enter `Sunny is still available — would Saturday at 11am work?` Send. | Reply appears as one two-line bubble. | |
| 12 | Marcus | Check Marcus's email. | "New message about offspring — Breedly" from Ellie. Its **Read message** link opens the conversation (after signing in if needed). | |
| 13 | Ellie | Open **Messages** (left menu). | Conversation list: each row shows **Marcus Reed**, preview, time, and a "N New" badge only on unread ones. No Previous/Next buttons when everything fits on one page. | |

## D. Share location & review

| # | Who | Action | Expected result | Pass |
|---|-----|--------|-----------------|------|
| 14 | Ellie | In the Honey conversation click **Share Location** → confirm. | A location card appears: *Sunny Meadow Farm*, full address, **Open in Google Maps**. | |
| 15 | Marcus | Open **Messages**. | The Honey conversation is labelled **Ellie Harper** (Marcus's own name never appears as the other party), preview "📍 Shared Location", "N New". The Shadow conversation shows **Read** (Marcus's own message doesn't count as new). | |
| 16 | Marcus | Open the Honey conversation. | Under the location card: "How was your experience with **Ellie Harper**?" with a **Rate** button. No red errors in the console. | |
| 17 | Marcus | **Rate** → 5 stars, tags **Communication** + **Animal Care**, comment `Quick answers and very transparent about health testing.` → **Submit**. | Toast "Your review has been submitted!"; prompt changes to "You rated Ellie Harper 5 stars". | |
| 18 | Marcus | Search ZIP `21701` again and open Sunny Meadow's **Profile**. | Rating stars + "(1 review)" on the card; the review with tags and comment in the profile. | |

## E. Notification preferences

| # | Who | Action | Expected result | Pass |
|---|-----|--------|-----------------|------|
| 19 | Ellie | Settings → **Notifications**: turn **off** "New messages" email. Save. | Success toast. | |
| 20 | Marcus | Send another message in the Shadow conversation. | Ellie gets **no** email and **no** bell notification for it (preference respected). Turn the setting back on afterwards. | |
