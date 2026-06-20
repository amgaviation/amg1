import type { Metadata } from "next";
import { LegalDocumentPage } from "@/components/compliance/legal-document-page";

export const metadata: Metadata = {
  title: "AMG Aviation Group — Terms & Conditions",
  description: "Terms and conditions for AMG Aviation Group website use.",
};

export default function TermsPage() {
  return <LegalDocumentPage slug="terms" />;
}
