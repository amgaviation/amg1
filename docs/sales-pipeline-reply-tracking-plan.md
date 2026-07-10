# Plan: Send Logging + Reply Tracking for the AMG Sales Pipeline

Status: PLAN ONLY — nothing implemented yet. Adds automatic send logging and reply
detection to the existing `amg-sales-pipeline` Cowork artifact. No code in the amg1
repo; this stays consistent with the reference doc's "no custom portal software
before launch volume" rule.

## Prerequisite (the one thing only Tony can do)

Connect the **Gmail connector** for the **information@amgaviationgroup.com**
account in claude.ai connector settings (Settings → Connectors → Gmail →
authorize). ops@ is an alias under that account and is the outreach identity:
always send As ops@ (set as default From, and enable Gmail's "Reply from the same
address the message was sent to"). Because alias mail lands in the same mailbox,
send detection and reply detection work unchanged. Verify once that mail TO ops@
actually delivers (send a test); a send-as-only alias that can't receive would
bounce replies and break the loop.

## Design

### 1. Data model (extends what the artifact already stores)

Per lead, in localStorage (later exportable to the spreadsheet):

- `status` (existing: Not contacted → Emailed → Replied → Meeting → Client / Pass)
- `sentAt` — timestamp of first outreach send
- `threadId` — Gmail thread ID of the outreach email
- `lastReplyAt` + `replySnippet` — first ~150 chars of their reply
- `followUpDue` — computed: sentAt + 7 days if no reply

### 2. Send logging (two modes, pick per comfort level)

**Mode A — detect sends (recommended to start).** Tony keeps sending from his own
mail client via "Open in Mail". A "Sync with Gmail" button in the artifact searches
the Sent folder for messages to each lead's address (`to:lead@example.com in:sent`),
and on a match sets status = Emailed, records `sentAt` + `threadId` automatically.
No behavior change, no send permissions granted to software.

**Mode B — send from chat (optional later).** Tony tells Claude "send the draft to
Sparkchasers"; Claude sends via the Gmail connector after showing the final text
for approval, then logs it. Faster at volume, but every send should stay
human-approved — cold outreach from a new domain is reputation-critical.

### 3. Reply tracking

Same sync action, second query: for every lead with status = Emailed, search
`from:lead@example.com newer_than:30d` (or fetch the logged `threadId` and check for
messages newer than `sentAt`). On a hit: status → Replied, store snippet, surface it
in the lead panel with a link to the thread. Statuses beyond Replied (Meeting,
Client, Pass) remain manual — those are judgment calls.

### 4. Surfacing it in the artifact UI

**Design: match the live portal (Operations Deck).** Use the same visual language as
www.amgaviationgroup.com/portal — navy chrome, light "Day Board" canvas,
champagne-gold accent, same typography feel. The artifact stays standalone (no code
in the repo, no `--deck-*` imports), but it should look like an AMG portal surface.

Functionality to add:

- Counters for **Awaiting reply** and **Follow-up due** (emailed ≥7 days ago, no
  reply), plus a "Needs follow-up" filter.
- Lead panel timeline: Sent Jul 8 → Replied Jul 10 + snippet.
- One-click "Draft follow-up" reusing the existing email generator with the original
  draft + their silence/reply as context (same anti-salesy voice rules).

### 5. Morning digest (optional, phase 3)

A scheduled task, weekdays ~8am: check the mailbox, then post a short summary —
"2 new replies (Sparkchasers, Eagle Aviation), 4 leads due for follow-up." Keeps
Tony out of the pipeline UI entirely on quiet days.

## Build order

1. **Phase 1 — Sync button:** send detection + reply detection + status/timestamps
   (needs Gmail connected; ~1 session). Before wiring, probe the Gmail tools once in
   chat to confirm the exact search-result shape the artifact must parse.
2. **Phase 2 — UI:** follow-up counters, filter, timeline, follow-up drafts.
3. **Phase 3 — Scheduled digest + spreadsheet export** (keep the XLSX as the durable
   backup of statuses; localStorage is per-machine).

## Risks / cautions

- **Deliverability first:** DNS checked July 7, 2026 (DNS hosted at Squarespace):
  SPF ✅ (`v=spf1 include:_spf.google.com ~all`); DKIM ❌ not published for the
  default `google` selector; DMARC ❌ no `_dmarc` record. Before any volume:
  (1) turn on DKIM in Google Admin → Gmail → Authenticate email, add the generated
  `google._domainkey` TXT at Squarespace, click Start authentication;
  (2) add `_dmarc` TXT: `v=DMARC1; p=none; rua=mailto:information@amgaviationgroup.com`,
  tighten to `p=quarantine` after ~3–4 weeks of clean reports;
  (3) verify with a test email ("Show original" should say SPF/DKIM/DMARC PASS).
  Cap sends at ~10–15/day from the fresh domain. If the portal later sends via
  Resend from this domain, add Resend's DKIM/SPF records too so DMARC keeps passing.
- **Matching is by email address**, so replies from a different address (e.g.
  shop owner's personal Gmail) won't auto-match — the manual status dropdown stays
  as the override.
- **localStorage is single-machine.** If Tony works from two Macs, Phase 3's
  spreadsheet export becomes the source of truth.
- CAN-SPAM basics for cold B2B email: real street address in the signature and
  honoring opt-outs. (Not legal advice — worth 5 minutes with the /legal page
  owner's counsel if volume grows.)
