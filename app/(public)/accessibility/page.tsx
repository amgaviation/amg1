import type { Metadata } from "next";
import { LegalDocumentPage } from "@/components/compliance/legal-document-page";

export const metadata: Metadata = {
  title: "AMG Aviation Group - Accessibility Statement",
  description: "Accessibility commitment, feedback channel, and known review practices.",
};

export default function AccessibilityPage() {
  return <LegalDocumentPage slug="accessibility" />;
}
