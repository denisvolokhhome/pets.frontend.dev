# 07 — Subscription & billing

**Persona:** Ellie (breeder), **Browser A**.
**Stripe is in test mode** — use only the test card from the README.

| # | Action | Expected result | Pass |
|---|--------|-----------------|------|
| 1 | Home page → **Pricing** section. | Three plans: **Free** (5 pets, 1 published location, 20 offspring), **Pro** $19/month (25 / 3 / 100), **Premium** $49/month (999 / 10 / 500). | |
| 2 | Settings → **Subscription**. | Current plan **Free**, Status Active, a **Plan usage** block with a bar per resource — e.g. **Pets 5 of 5** (red, "Limit reached — upgrade your plan to add more."), **Published locations 1 of 1**, **Offsprings N of 20** (green; only Available/Reserved count) — and the three plans with **Upgrade** on Pro and Premium. No error banner. | |
| 3 | With 5 pets on the Free plan, try **Add Pet**. | The pet is refused with a clear message, e.g. "Pet limit reached. Your plan allows 5 pets." (shown as a toast, not "Access forbidden"). | |
| 4 | Back on Subscription click **Upgrade** on **Pro**. | Redirect to Stripe Checkout (`checkout.stripe.com`) showing the Pro price. | |
| 5 | Pay with card `4242 4242 4242 4242`, `12 / 34`, CVC `123`, ZIP `21701`. | Redirect back to Settings → Subscription. Toast **"Subscription Updated — You are now on the Pro plan!"**. Current plan **Pro**, usage now reads **5 of 25**, **1 of 3**, **N of 100**, **View Invoices** appears. | |
| 6 | Click **View Invoices**. | The Pro invoice is listed. | |
| 7 | Add a 6th pet. | Now succeeds. | |
| 8 | **Cancel test:** start an upgrade to Premium and on Stripe click the back/cancel link. | Back on Subscription, still **Pro**, no charge, no error. | |
| 9 | *(Dev team)* Stripe Dashboard (test mode) → Customers → Ellie's email. | Exactly one active subscription (Pro). | |

> If step 5 returns you to the Sign In page (session expired while paying), sign in again —
> you must land back on Subscription and the upgrade must still be applied.
