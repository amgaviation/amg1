# ADR-024: ForeFlight Flight Intelligence analytical mirror

**Status:** Accepted — 2026-07-23

## Context

ForeFlight Business does not provide a supported direct MCP workflow for this portal. ForeFlight remains Tony's authoritative logbook. AMG needs a restricted operational view that can ingest ForeFlight CSV exports, preserve evidence, identify data-quality concerns, and calculate explicitly non-determinative planning estimates.

## Decision

The MVP accepts a manually uploaded CSV only. It validates a documented ForeFlight-compatible header set, previews valid and invalid rows, writes the original file to a private `logbook-source-files` bucket, and persists an import batch and row provenance. A normalized, owner-scoped `logbook_entries` record carries an SHA-256 canonical-row fingerprint. A unique owner/fingerprint constraint makes repeated imports idempotent even when a file is renamed.

All portal mutations run on the server after an approved `admin` or `super_admin` authorization check. RLS independently prevents direct reads and writes by non-admin users. The initial mirror is intentionally scoped to the authenticated administrator's profile; it does not expose pilot logbook data to clients, crew, or partners.

Audit rules produce immutable hard-error or review-warning findings. Currency snapshots are projections only: they identify the relevant imported evidence and gaps, never state FAA eligibility, and do not replace a complete logbook review, medical certificate review, or qualified aviation/legal advice.

Gmail ingestion is deferred. The current portal contains inbound email infrastructure but no verified Gmail OAuth connector, mailbox ownership model, or consent/retention controls for private logbook attachments. Adding it now would create an unsafe implied integration.

## Consequences

- Manual upload is production-capable immediately for ForeFlight Business users.
- Export-version header differences are rejected safely with row-level feedback instead of guessed mappings.
- Source files are retained privately and each normalized row points to both its batch and source row number.
- The feature adds isolated schema, storage, routes, and tests; it does not alter operational-flight, client, or crew data.
