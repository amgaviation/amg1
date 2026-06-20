# Compliance Copy Audit

Current automated scan checks direct prohibited aviation claims such as “Book aircraft,” “Charter now,” “AMG fleet,” “Guaranteed crew,” “Pay now,” and similar phrases outside approved guardrail files.

Findings during implementation:

- Direct prohibited CTA language was not found in public/portal copy.
- Negative/disclaimer uses such as “not guaranteed crew availability” remain acceptable because they reduce, rather than create, misleading claims.
- Guardrail phrase lists are allowed in `lib/compliance/aviation-claim-guard.ts` and compliance documentation.

Run:

```bash
npm run compliance:check
```
