# AMG Global Interface Standard v1

Preview branch: `redesign/amg-global-interface-v1`

## Repository Inventory

- Public routes live under `app/(public)`: home, about, contact, capabilities, plans, aircraft support, crew network, AMG Connect, request support, auth entry pages, FAQs, and legal notice pages.
- Portal routes live under `app/portal`: client, crew, partner, admin, and super-admin surfaces. `app/portal/page.tsx` redirects authenticated users to `ROLE_HOME`.
- Logo usage currently comes from approved image assets in `public/images/logo-white.png`, `public/images/logo-navy.png`, `public/images/logo-blue.png`, and `public/images/logo-original.png`. The redesign reuses `logo-white.png` and `logo-navy.png` only.
- Website imagery is centralized through `lib/site-media.ts` and backed by `public/images/amg-custom`, `public/images/amg-generated`, `public/images/portal-screenshots`, and `public/videos`.
- Tailwind uses v4 CSS configuration through `app/globals.css`; there is no `tailwind.config.ts`.
- shadcn/ui is configured in `components.json`, with primitives in `components/ui/*`.
- Public layout is `app/(public)/layout.tsx`, with `components/site/site-nav.tsx` and `components/site/site-footer.tsx`.
- Portal layout is composed per route with `components/portal/shell/portal-shell.tsx`; shared portal cards, headers, notices, fields, and badges live in `components/portal/ui/*`.
- Auth and role protection are enforced by `proxy.ts`, `lib/portal/session.ts`, and per-page `requireRole`, `requireUser`, or `requireSuperAdmin` calls.
- Supabase utilities are `lib/supabase/server.ts`, `lib/supabase/client.ts`, and generated types in `lib/supabase/database.types.ts`.
- Public content comes from `lib/content.ts` and website-editor JSON in `content/site/*.json`.
- Pricing, plans, and aircraft support plan structure come from `lib/plans.ts` and related database-backed portal query modules. This UI pass does not change them.
- API routes are in `app/api/*`; auth callback/setup handlers are in `app/auth/*`.
- Build setup is Next.js 16 with TypeScript, Tailwind CSS v4, shadcn/ui, Framer Motion, and Supabase SSR. Scripts are in `package.json`.

## Interface Tokens

The active AMG palette is restricted to:

- Midnight Navy `#050B14`
- Deep Blue `#07111F`
- Accent Blue `#3B82F6`
- Slate Gray `#9CA3AF`
- Light Gray `#C0C7D1`
- White `#FFFFFF`

Shared token exports live in `lib/design-tokens.ts`. Runtime CSS variables and Tailwind theme aliases live in `app/globals.css`.

## Entrance Animation Asset Brief

Higgsfield CLI generation was completed locally on this branch.

- CLI: `higgsfield 0.2.3 (868f62a6e61ad092074b8af6bb10b17b199b8a15)`.
- Account status at generation time: signed in as `information@amgaviationgroup.com`.
- Final accepted job: `3c6f8636-dd6b-4233-af21-14a28dac8280`.
- Model: `kling3_0_turbo`.
- Params: `aspect_ratio=16:9`, `duration=3`, `resolution=1080p`.
- Stored source, video-only from the accepted Higgsfield job: `public/animations/entrance/amg-hangar-entrance-source.mp4`.
- Optimized WebM: `public/animations/entrance/amg-hangar-entrance.webm`.
- Optimized MP4: `public/animations/entrance/amg-hangar-entrance.mp4`.
- Poster: `public/animations/entrance/amg-hangar-entrance-poster.webp`.

The first Higgsfield generation was rejected because the aircraft included pseudo tail markings. The final accepted generation uses an unmarked business jet, no generated logo, no visible tail numbers, and a navy/blue/white hangar reveal. Production variants were encoded from the video stream only; source audio was stripped with ffmpeg.

Higgsfield generation brief:

Create a cinematic 3-second aviation entrance animation for AMG Aviation Group. Scene: closed private aviation hangar doors at dusk/night, subtle ramp lights, low fog/reflection on polished ramp surface. The hangar doors slowly open to reveal a premium unmarked business jet parked on the ramp, softly lit, corporate aviation tone, minimal luxury, no passengers, no crowd, no text, no logo, no registration marks, and no tail numbers. Camera movement should be slow and controlled, centered, premium, and smooth. Color palette: midnight navy, deep blue, white highlights, slate gray, and subtle blue accent lighting. No yellow, no gold, no cartoon styling, no oversaturated colors, no action-movie effects, no excessive lens flare. The final frame should be clean and usable as a transition into the website hero.

## Scope Guardrails

This branch intentionally does not change Supabase migrations, API contracts, server actions, auth behavior, role checks, RLS, pricing data, plan data, service definitions, or operational workflows.
