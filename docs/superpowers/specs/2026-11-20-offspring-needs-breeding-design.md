# Add Offspring: guide breeders who have no breeding yet

Frontend only (`pets.frontend.dev`).

## Why

Offspring belong to a breeding (a litter). On Offspring → **Add Offspring** the form
opens with a required, empty "Breeding" dropdown when the breeder has no breeding, and
they feel stuck. The chain is really pets → breeding → offspring: Quick Breeding needs a
male and a female pet, so a brand-new breeder can hit a second dead end.

## Design (approved 2026-11-20)

1. **Check before opening the form.** Clicking Add Offspring loads breedings. Voided ones
   don't count. If there is at least one, open the form as today.
2. **No breeding, but the breeder has a male and a female pet:** dialog "Create a breeding
   first" with the copy *"Offspring belong to a breeding (a litter). You don't have any
   breedings yet. Create one, then add the puppies to it."* and the buttons **Cancel** /
   **Create breeding**. Confirming goes to `/breedings?new=1&then=offspring`, which opens
   Quick Breeding immediately.
3. **Continue the chain.** With `then=offspring`, Quick Breeding goes to the new breeding
   at `/breeding/:id?addOffspring=1` once it's created. The breeding page then opens its
   Add Offspring form automatically and removes the query parameter.
4. **No breeding and no male+female pair:** the dialog says to add a male and a female pet
   first, and **Add pets** goes to `/pets?new=1`, which opens Add Pet if the breeder has a
   location (Add Pet needs a location).
5. **No location (found while testing):** Add Pet is disabled without a breeding
   location. Arriving at `/pets?new=1` with no location shows "Add a breeding location
   first", and **Add location** goes to `/settings/locations?new=1`, which opens the add
   form. The Pets empty state also explains this, with an **Add a location** button,
   instead of "Please add a pet" next to a disabled button.
6. **Safety net:** the offspring form lists only non-voided breedings. If that list is
   empty, it shows a "Create a breeding first" link instead of the empty dropdown.

## Approaches considered

- Dialog before the form, then send the user to Breedings with Quick Breeding open
  (**chosen**; the user asked to be sent to the Breedings screen).
- Open Quick Breeding over the Offspring page: fewer page changes, but it nests a
  stepper inside the offspring flow and the user explicitly wanted the Breedings screen.
- Hint inside the form only: the user still meets a form they can't finish.

## Builder's calls

- "Active" breeding = any status except Voided (a Done litter can still get puppies).
- "Pair" = at least one pet with gender Male and one with Female (case-insensitive).
- The prerequisite rule is a pure function in `src/app/utils/offspring-prereq.ts`, so it
  can be unit tested.
