# Cookie Consent Setup

Status: implementation guide.

## Categories

- Necessary: always enabled for site and portal operation.
- Analytics: aggregate measurement.
- Marketing and retargeting: ad and audience tools.
- Session recording and behavior analytics: troubleshooting and UX behavior tools.
- Embedded tools: optional third-party maps, media, chat, scheduling, or form embeds.

## Script Gating Rule

All optional scripts must be registered in `lib/compliance/consent.ts` and loaded through `components/compliance/consent-script-loader.tsx`. Do not add optional tracking scripts directly to layouts, pages, or components.

## Supported Environment Keys

- `NEXT_PUBLIC_GA_MEASUREMENT_ID`
- `NEXT_PUBLIC_GTM_ID`
- `NEXT_PUBLIC_META_PIXEL_ID`
- `NEXT_PUBLIC_CLARITY_PROJECT_ID`
- `NEXT_PUBLIC_EMBEDDED_TOOLS_ENABLED`

Unset keys do not load scripts. Set keys still do not load until the related consent category is enabled.

## QA

- Clear local storage and reload a public page. Banner should appear.
- Reject optional. No optional scripts should be injected.
- Open Cookie Preferences from the footer, enable analytics, save, and reload.
- Confirm only analytics scripts are injected when analytics is enabled.
- Confirm Global Privacy Control keeps optional categories disabled unless the visitor changes preferences.
