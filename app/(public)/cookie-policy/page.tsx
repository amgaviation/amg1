import type { Metadata } from "next";
import { LegalDocumentPage } from "@/components/compliance/legal-document-page";

export const metadata: Metadata = {
  title: "AMG Aviation Group - Cookie Policy",
  description: "Cookie categories, consent controls, and script-gating practices for the AMG website and portal.",
};

export default function CookiePolicyPage() {
  return <LegalDocumentPage slug="cookie-policy" />;
}
