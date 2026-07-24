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
