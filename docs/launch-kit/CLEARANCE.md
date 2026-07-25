# Launch Clearance

Two of the four launch prerequisites cannot be read out of the codebase, so they
are recorded here. `npm run launch:ready` looks for a checked box **and a date**
on each line.

Do not tick these early. A date next to "policy bound" that is not true is the
same act as a misstatement on the insurance application, and Fla. Stat. §627.409
treats it the same way — rescission, including for an innocent error, after a loss.

- [ ] Insurance bound — carrier, policy number, YYYY-MM-DD
- [ ] Counsel review — firm, YYYY-MM-DD

The other two prerequisites (founder credentials and photo, real street address)
are read directly from `lib/site-config.ts` and cannot be cleared from this file.

Full detail and the prepared artifacts: `10-blocker-clearance.md`.

## Verified, not open

Recorded here because they are launch facts someone will otherwise re-check.

- **Stripe is live and can take a payment today.** Account `acct_1TjL8tCsUD8TlMqi`,
  display name **AMG Aviation Group LLC**, `livemode: true`, USD. Verified against the
  Stripe API on 2026-07-25. The "can I actually collect the $895" question is answered.
- **Legal entity: AMG Aviation Group LLC**, a Florida limited liability company. Taken
  from the Stripe account's registered name, which is the name the bank and the card
  networks know. Document 01's opening recital now says this rather than "a Florida
  company" — the entity form was one of its open questions. Confirm it matches the
  Sunbiz registration exactly before signing anything, including the suffix.
- **Balance note:** available balance was **-$0.34** at the time of checking. Trivial in
  itself, but a negative available balance nets against the next charge and can hold a
  payout. Worth clearing before the first real invoice so the first payment settles clean.
