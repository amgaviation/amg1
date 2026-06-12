# Public Site Test Report

Date: 2026-06-12

Branch: `fix/public-site-production-remediation`

## Commands Run

```bash
npm run typecheck
npm run media:audit
npm run build
TARGET_URL=http://localhost:3000 node /Users/tonygonzalez/.codex/skills/playwright-skill/run.js /tmp/playwright-test-amg-public.js
npx -y lighthouse http://localhost:3000 --only-categories=performance,accessibility,best-practices,seo --chrome-flags="--headless --no-sandbox" --output=json --output-path=/tmp/lighthouse-amg-home-prod-final.json
```

## Results

- TypeScript: passed.
- Media duplicate audit: passed.
- Production build: passed.
- Browser route/form verification: passed for 14 routes across 3 viewport sets.
- Portal route compile check: passed through production build.
- Protected portal file diff: clean.

## Browser Verification Scope

Routes checked:

- `/`
- `/about`
- `/services`
- `/aircraft`
- `/plans`
- `/pilot-network`
- `/team`
- `/contact`
- `/privacy-policy`
- `/terms`
- `/operational-disclaimer`
- `/mission-acceptance`
- `/credential-submission`
- `/login`

Viewports checked:

- 390 x 844
- 768 x 1024
- 1440 x 900

Functional checks:

- Public routes return non-error responses.
- Public pages render visible body content.
- Required non-login routes include an `h1`.
- Horizontal overflow check passed.
- Plans selector shows the custom-proposal state for Super-Midsize Jet.
- Contact form preselects Subscription Program Inquiry from query parameters.
- Contact form switches visible fields when category changes.

## Lighthouse

Local production build home page:

- Performance: 87
- Accessibility: 100
- Best Practices: 100
- SEO: 100

Notes:

- Performance improved after disabling eager public-route prefetching in the fixed nav and replacing the large PNG hero poster with a compressed JPEG poster.
- The hero video remains enabled because AMG requested the home hero background to play `amg-jet-flying.mp4`.
