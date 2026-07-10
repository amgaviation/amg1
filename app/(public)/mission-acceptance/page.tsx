import type { Metadata } from "next";
import { LegalDocumentPage } from "@/components/compliance/legal-document-page";
import { SITE } from "@/lib/site-config";

const CANONICAL_BASE = process.env.NEXT_PUBLIC_APP_URL || SITE.url;

// This document is also served at /legal/mission-acceptance. This standalone
// route is the canonical one; the /legal counterpart points here.
export const metadata: Metadata = {
  title: "AMG Aviation Group — Mission Acceptance Policy",
  description: "Mission acceptance policy for AMG Aviation Group support requests.",
  alternates: { canonical: `${CANONICAL_BASE}/mission-acceptance` },
};

export default function MissionAcceptancePage() {
  return <LegalDocumentPage slug="mission-acceptance" />;
}
