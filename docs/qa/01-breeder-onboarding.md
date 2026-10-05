# 01 — Breeder onboarding

**Persona:** Ellie Harper, owner of *Sunny Meadow Retrievers*.
**Browser A** (keep it for the breeder in all later documents).
**Starts:** signed out, on the home page.

## A. Sign-up form validation

| # | Action | Expected result | Pass |
|---|--------|-----------------|------|
| 1 | Open the home page. Click **Get Started** in the top bar. | A menu opens with **I'm a Breeder** and **I'm a Pet Seeker** only (no "Service Provider"). Clicking the button opens it; clicking outside closes it. | |
| 2 | Click **Register as Breeder** in the hero. | Sign-up form opens directly at step 2 ("Create Account"); the stepper shows **Breeder ✓**. | |
| 3 | Fill First name `Ellie`, leave Last name empty, Email `not-an-email`, Password `short`, Confirm `different`. Don't tick the terms. Click **Create Account**. | No account is created. Red messages appear under each field: "Last name is required", "Enter a valid email address", password rules (8+ characters, a digit), "Passwords don't match", "You must accept the Privacy Policy and Terms of Use". Focus jumps to the first invalid field. | |
| 4 | Type in the Password field slowly. | The password rule messages update while typing. | |

## B. Create the account and verify email

| # | Action | Expected result | Pass |
|---|--------|-----------------|------|
| 5 | Fix the form: Last name `Harper`, your Ellie email, Password and Confirm `Breeder2026!`, tick the terms. Click **Create Account**. | "Check your email" page showing the address. | |
| 6 | Open the inbox for that address. | Two emails: **Welcome to Breedly!** and **Verify your Breedly email address**. | |
| 7 | Click the button/link in the verification email. | App opens, shows a "verified" confirmation, then signs you in and opens the **Breeder Dashboard**. | |
| 8 | Look at the dashboard. | Greeting uses the name **Ellie Harper** (not the email). A **Welcome to Breedly! 🎉** dialog explains two setup steps (breeder profile, location). | |

## C. Breedery profile

| # | Action | Expected result | Pass |
|---|--------|-----------------|------|
| 9 | In the welcome dialog click **Go to Settings**. | Settings → **Breedery Information** opens. | |
| 10 | Click **Choose Image** and pick `oversized-12mb.png`. | Error toast: file exceeds 5 MB. Nothing uploads. | |
| 11 | Choose `vet-certificate.pdf` as the image. | Error toast: invalid file type (allowed JPEG, PNG, GIF, WebP). | |
| 12 | Choose `breedery-logo.png`. | Success toast; the logo shows in the preview **and** in the avatar at the top-right. | |
| 13 | Breedery name `Sunny Meadow Retrievers`; description: `Family-run breedery in Frederick, MD raising health-tested Golden and Labrador Retrievers since 2012.` | Text is accepted. | |
| 14 | In **Search Tags** type `Golden Retriever` and press **Enter**. Repeat with `Labrador` and `OFA certified`. | Each tag appears as a chip. **Pressing Enter must NOT save the form** (no "updated" toast appears). | |
| 15 | Type `Maryland` and click **Add**. Then type `golden retriever` (lowercase) and press Enter. | `Maryland` is added. The lowercase duplicate is **not** added. | |
| 16 | Click **Save Changes**. | Exactly **one** success toast. | |
| 17 | Reload the page. | Name, description, logo and the 4 tags are still there. | |

## D. Breeding location

| # | Action | Expected result | Pass |
|---|--------|-----------------|------|
| 18 | Settings → **Breeding Locations** → **Add Location**. Click the form's submit button with everything empty. | Inline errors for location name, address, city, state, ZIP. | |
| 19 | Fill: name `Sunny Meadow Farm`, address `100 W Patrick St`, city `Frederick`, state `Maryland`, ZIP `21701`. Save. | Success toast. A location card shows the address, a **Published** toggle (on), and a **Default** badge (the first location is the default automatically). | |
| 20 | Check the card's buttons. | Small, consistent buttons: **Edit** and **Delete** (Delete separated on the right, red outline). No "Make default" on the default location. | |

## E. Account settings & password change

| # | Action | Expected result | Pass |
|---|--------|-----------------|------|
| 21 | Settings → **General**. Enter Phone `3015550142`. | Phone formats as `(301) 555-0142`. | |
| 22 | Click **Save Changes**, then reload. | Success toast; name and phone persist. | |
| 23 | In **Password**: Current `WrongPassword1`, New + Confirm `NewBreeder2026!`. Save. | Inline error under Current Password: **"Current password is incorrect"**. No success toast. | |
| 24 | Clear Current; set Confirm to `Mismatch2026!`. Save. | Inline errors: "Enter your current password" and "Passwords don't match". | |
| 25 | Current `Breeder2026!`, New + Confirm `NewBreeder2026!`. Save. | Toast "Profile saved and password changed"; the three password fields are cleared. | |
| 26 | Click the avatar → **Logout**. Sign in with the **old** password. | Error toast "The email or password you entered is incorrect…". | |
| 27 | Sign in with `NewBreeder2026!`. | Signed in, Breeder Dashboard opens. | |
| 28 | After logging out in step 26, check whether the cookie banner came back. | The cookie banner does **not** reappear after logout (it was accepted earlier). | |
