# Public Site Remediation Status

Branch: `fix/public-site-production-remediation`

Base commit: `f9afe26848e62e39d431b51ca61793a643bd7a48`

## Checkpoints

- [x] Branch created from latest `main` and pushed to GitHub.
- [x] Portal-protection scope identified before public changes.
- [x] Deployment runbook created.
- [x] Build metadata endpoint added.
- [ ] Public design system corrected.
- [ ] Public page architecture and content rebuilt.
- [ ] Aircraft imagery corrected and documented.
- [ ] Subscription programs rebuilt.
- [ ] Dynamic request-support form rebuilt.
- [ ] Accessibility, performance, SEO, and testing completed.
- [ ] Final production deployment verified.

## Current Notes

- Portal files are protected for this remediation. Public changes should avoid `app/portal`, `components/portal`, `lib/portal`, Supabase schema/policy files, portal API routes, and auth routing.
- Production must be created only by merging the completed branch into `main`.
- No Supabase schema or policy changes are planned for this public-site remediation.
