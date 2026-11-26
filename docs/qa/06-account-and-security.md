# 06 — New visitors, sign-in & account security

**Persona:** Jordan Lee, a new visitor. Use **Browser B** after signing Marcus out
(avatar → Logout), or a third browser.

## A. New visitor contacts a breeder and signs up mid-way

| # | Action | Expected result | Pass |
|---|--------|-----------------|------|
| 1 | Signed out, open a listing directly (e.g. Shadow via the search → Sunny Meadow → Offsprings → Shadow). | Public listing loads without signing in. No console errors other than `401` for the session check. | |
| 2 | Click **Contact Breeder**. | "Sign In Required" dialog with email/password and **Register here**. | |
| 3 | Click **Register here**. | Sign-up form opens as **Pet Seeker**. | |
| 4 | Sign up as Jordan Lee (`Jordan2026!`), then open the verification email link **in a new tab**. | After the "verified" message you land back on **Shadow's listing** (not the dashboard), signed in as Jordan. | |
| 5 | Click **Contact Breeder**, send `Hello! Is Shadow good with other dogs?`. | Message sent; conversation with **Ellie Harper** appears in the list. | |
| 6 | From the search page, click **Contact** on a breeder card while signed out (use another browser). | Same "Sign In Required" dialog. | |

## B. Forgot / reset password

| # | Action | Expected result | Pass |
|---|--------|-----------------|------|
| 7 | Log out. On Sign In click **Forgot password?**, enter `not-a-valid-email@x`, **Send Reset Link**. | Red message "Please enter a valid email address." | |
| 8 | Enter Jordan's email. Send. | Neutral message "If an account exists with that email, you'll receive reset instructions shortly…" (the same message is shown for unknown emails — this is intentional). | |
| 9 | Open the **Reset your Breedly password** email, click the link. | "Set New Password" page with password + confirm. | |
| 10 | Enter `Reset2026!x` and `Different2026!`. Submit. | Error: passwords do not match. | |
| 11 | Enter `Reset2026!x` twice. Submit. | "Your password has been reset successfully." with a **Sign In** button. | |
| 12 | Open the **same reset link** again and try to set another password. | Rejected (the link only works once). | |
| 13 | Sign in with the old password, then with `Reset2026!x`. | Old: error. New: signed in. | |

## C. Sign-in redirects & session

| # | Action | Expected result | Pass |
|---|--------|-----------------|------|
| 14 | Signed out, paste `<app>/settings/subscription` (as Ellie) or `<app>/favorites/offsprings` (as a seeker) into the address bar. | Redirected to Sign In; the URL contains `?returnUrl=…`. | |
| 15 | Sign in. | You land on the page you originally asked for, **not** the dashboard. | |
| 16 | Try `<app>/login?returnUrl=https://example.com` and sign in. | You land on the **dashboard** (external return URLs are ignored). | |
| 17 | *(Dev team assists)* With the app open, invalidate the session (e.g. wait for the token to expire, or ask a developer to replace `id_token` in Local Storage with garbage) and click around. | Redirected to Sign In with a toast **"Session expired — Please sign in again."** No endless background errors in the console. | |
| 18 | Avatar → **Logout**. | Back to Sign In/home; protected pages now redirect to Sign In. The cookie banner does not reappear. | |

## C2. Sign-in brute-force protection

Use a throwaway email — the lock applies to that address (and to your IP) for 15 minutes.

| # | Action | Expected result | Pass |
|---|--------|-----------------|------|
| 18a | On Sign In enter `lockout.test@example.com` with a wrong password and submit **10 times**. | Each time: "Invalid email or password". | |
| 18b | Submit an 11th time. | Red toast **"Sign-In Paused — Too many sign-in attempts. Please wait 15 minutes and try again."** and the same text in the Login Failed box. | |
| 18c | Sign in as Jordan with the correct password (same browser). | Works — a successful sign-in is never blocked by another account's failures (unless 20+ failures came from your network). | |

## D. Role separation

| # | Action | Expected result | Pass |
|---|--------|-----------------|------|
| 19 | As a **pet seeker**, open `<app>/pets`, `<app>/breedings`, `<app>/offsprings`. | Redirected away (toast: only accessible to breeders). | |
| 20 | As anyone, open `<app>/services` and `<app>/settings/service-categories`. | Redirected to the dashboard (service providers are hidden pre-launch). | |
| 21 | Look everywhere (menus, home page, sign-up, search toasts, **Privacy Policy, Terms of Use**) for "Service Provider". | Not shown anywhere. The Privacy Policy describes Google sign-in and email notifications; both legal pages show "Last updated October 4, 2026". | |

## E. Export all breedery data

Use a breeder with pets, a breeding, a sold puppy, photos and at least one document (e.g. Ellie).

| # | Action | Expected result | Pass |
|---|--------|-----------------|------|
| 22 | As the breeder, **Settings → Export data**. | Page lists what's included; button **Export my data**. Not visible to pet seekers (`<app>/settings/export` redirects them). | |
| 23 | Click **Export my data**. | "Preparing your archive…" with a spinner; after a short wait it switches by itself to **Your archive is ready** with **Download (N MB)** and "available until" ~24 h from now. | |
| 24 | Leave the page while it's preparing, come back. | Still preparing or ready — the export kept going. | |
| 25 | Click **Download**. | The browser's own download starts (`breedly-export-YYYY-MM-DD.zip`). | |
| 26 | Unzip it. | `README.txt`, CSVs (locations, pets, breedings, breeding_pets, matings, progesterone_tests, milestones, offspring) open correctly in Excel (accents intact); sold puppies and deleted pets are in the sheets; `photos/` and `documents/` contain the files, in folders by pet/puppy name. | |
| 27 | Copy the download link from the browser's downloads list and open it in a private window after a minute or two. | It still works within the hour after the first download; a link that was never used stops working after 60 seconds. | |
| 28 | Click **Create a new export**. | A new archive is prepared; the old one is gone. | |

## Continue on your phone (QR sign-in)

Use a desktop browser signed in as Ellie (breeder) and a real phone (or a second browser at phone width).

| # | Action | Expected result | Pass |
|---|--------|-----------------|------|
| 29 | On desktop, open a breeding page and click the **phone icon** left of the map icon. | Popup **Continue on your phone**: three numbered steps, a QR code, "Expires in 2:00 · a new code appears automatically", and the "don't share this code" note. No copy-link button. | |
| 30 | Make the window 900px wide, then 700px wide. | 900px: the phone icon sits next to the ☰ button. 700px: no phone icon. | |
| 31 | Scan the QR with the phone camera (phone signed out of Breedly). | The phone opens **Sign in to Breedly as Ellie's breedery (e•••@…)** — the full email is not shown, and the address bar shows just `/m`. | |
| 32 | Tap **Continue**. | The phone is signed in and opens the same breeding page. Within a few seconds the desktop popup shows **Signed in on your phone** and closes itself. | |
| 33 | Scan the same QR again from a photo/screenshot. | "This code has expired or was already used. Generate a new one on your computer." with a **Sign in with email** link. | |
| 34 | Open the popup, wait 2 minutes. | The countdown reaches 0 and a new QR appears by itself; the old one no longer works. | |
| 35 | Open the popup, switch to another tab for 30 seconds, come back. | The same QR is still shown (if time is left), and it still works. | |
| 36 | With the phone already signed in as Ellie, scan a new code. | The phone goes straight to the page (no Continue screen); the desktop shows **Already signed in on your phone**. | |
| 37 | With the phone signed in as Sam (pet seeker), scan Ellie's code. | "This phone is signed in as Sam. Continuing will switch accounts." Continue switches the phone to Ellie. | |
| 38 | Log out on the phone. | Only the phone is signed out; the desktop stays signed in. | |
