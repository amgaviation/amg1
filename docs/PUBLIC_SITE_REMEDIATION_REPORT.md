# Public Site Remediation Report

## Initial Findings

- Public pages still contain motion wrappers that can render content hidden before client-side animation initializes.
- The public site depends on Lenis smooth scrolling, which is unnecessary for core content visibility and can complicate reduced-motion behavior.
- Aircraft imagery includes known mismatches and repeated category photography.
- Subscription plan naming and pricing language need replacement with proposal-based subscription programs.
- The support form needs category-specific fields, validation, and confirmation behavior.
- Public navigation and footer need simplification around a single `Member Login` entry.
- Portal routes and Supabase-backed portal behavior must remain unchanged.

## Root Cause Summary

Recent preview and portal-completion work changed shared public components, motion behavior, media usage, and deployment assumptions over multiple branches. This remediation keeps portal behavior fixed while replacing the public system in one branch.

## Work Log

- Created branch `fix/public-site-production-remediation` from latest `main`.
- Added `/api/build-info` for Git SHA verification.
- Added deployment runbook and initial remediation status.
- Added portal-protection inventory.

## Final Results

Pending completion.
