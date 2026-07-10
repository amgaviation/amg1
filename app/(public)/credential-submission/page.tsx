import type { Metadata } from "next";
import { LegalDocumentPage } from "@/components/compliance/legal-document-page";
import { SITE } from "@/lib/site-config";

const CANONICAL_BASE = process.env.NEXT_PUBLIC_APP_URL || SITE.url;

// This document is also served at /legal/credential-submission. This standalone
// route is the canonical one; the /legal counterpart points here.
export const metadata: Metadata = {
  title: "AMG Aviation Group — Credential Submission Notice",
  description: "Credential submission notice for AMG Aviation Group pilot network profiles.",
  alternates: { canonical: `${CANONICAL_BASE}/credential-submission` },
};

export default function CredentialSubmissionPage() {
  return <LegalDocumentPage slug="credential-submission" />;
}
