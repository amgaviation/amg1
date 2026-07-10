# Audit Report Contract

## Severity

| Level | Definition | Examples |
| --- | --- | --- |
| P0 Critical | Immediate severe harm, unsafe irreversible action, or total outage across the product | destructive action without control; widespread inaccessible application |
| P1 High | Critical workflow blocked, serious access barrier, major trust failure, or defect affecting most users | login impossible; primary form cannot submit; mobile navigation unusable |
| P2 Medium | Material friction, confusion, inconsistency, or partial workflow failure with a workaround | filters lose state; clipped actions at a common breakpoint; unclear error recovery |
| P3 Low | Localized quality issue with limited user impact | minor alignment drift; noncritical copy inconsistency; small asset-quality defect |
| P4 Enhancement | Improvement not required to correct a verified defect | optional shortcut; additional personalization; new nonessential feature |

Do not assign severity from visual conspicuousness alone. Consider reach, frequency, workflow importance, accessibility, recoverability, trust, and data risk.

## Confidence

- **Confirmed:** directly reproduced or proven by deterministic source/test evidence.
- **High:** strongly supported by multiple observations but one condition remains unverified.
- **Medium:** plausible and evidence-backed, but environment or data limitations prevent confirmation.
- **Low:** hypothesis worth investigating; do not place in the primary defect count unless clearly labeled.

## Required finding fields

```text
ID:
Title:
Severity:
Confidence:
Category:
Surface: route / role / state / viewport / browser / component
Affected instances: count and representative list
Observed:
Expected:
Impact:
Reproduction:
Evidence:
Root cause: confirmed | inferred
Remediation:
Verification:
```

## Evidence hierarchy

Prefer evidence in this order:

1. reproducible rendered behavior plus screenshot/video frame;
2. console, network, accessibility-tree, DOM, or performance trace;
3. failing automated test or diagnostic command;
4. exact source path and symbol/line;
5. screenshot/recording observation without runnable access;
6. reasoned hypothesis, explicitly labeled.

Never cite a screenshot as proof of invisible behavior. Never cite source as proof of rendered appearance without rendering it.

For a source-only conditional risk, append `Runtime confirmation:` with the exact viewport, input sequence, state, and observation that would prove or disprove it.

## Deduplication

- Consolidate repeated instances caused by a shared component, token, layout, or utility into one finding.
- List affected routes/components as instances under that finding.
- Split findings when remediation owners, root causes, or user outcomes differ.
- Do not count responsive manifestations at several widths as separate defects unless causes differ.
- Keep editorial preferences separate from defects.

## Executive summary rules

- Lead with release readiness or the strongest user risk.
- State counts by severity only after deduplication.
- Name the most affected workflows and shared root causes.
- State material coverage gaps beside the conclusion.
- Avoid false precision such as a single “UX score” unless a scoring model was requested and defined in advance.

## Verification record

List commands and workflows that were actually run with their result. Then list material checks that were not run and the reason, such as unavailable dependencies, missing credentials, an unextractable archive, unsupported browser tooling, or a consequential production action.
