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
