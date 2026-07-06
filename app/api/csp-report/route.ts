import { NextResponse } from "next/server";

// Receives Content-Security-Policy violation reports and logs them so blocked
// resources surface in the Vercel runtime logs. The enforced CSP in
// next.config.ts can't be pre-tested against the auth-walled preview, so this
// is the safety net: if a real page loads a resource the policy blocks, the
// violation is recorded here instead of failing silently.
//
// Handles both report formats:
// - legacy report-uri  -> Content-Type: application/csp-report, { "csp-report": {...} }
// - Reporting API       -> Content-Type: application/reports+json, [ { "body": {...} } ]
export const dynamic = "force-dynamic";

type CspViolation = Record<string, unknown>;

function summarize(violation: CspViolation) {
  return {
    documentUri: violation["document-uri"] ?? violation["documentURL"],
    violatedDirective:
      violation["violated-directive"] ?? violation["effectiveDirective"],
    blockedUri: violation["blocked-uri"] ?? violation["blockedURL"],
    sourceFile: violation["source-file"] ?? violation["sourceFile"],
    lineNumber: violation["line-number"] ?? violation["lineNumber"],
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    const entries = Array.isArray(body) ? body : [body];

    for (const entry of entries) {
      const record = entry as Record<string, unknown>;
      const violation = (record["csp-report"] ??
        record["body"] ??
        record) as CspViolation;
      console.warn("[csp-report]", JSON.stringify(summarize(violation)));
    }
  } catch {
    // Malformed or empty report body — nothing to log.
  }

  // Report sinks should acknowledge with no content.
  return new NextResponse(null, { status: 204 });
}
