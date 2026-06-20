import type { Metadata } from "next";
import { LegalDocumentPage } from "@/components/compliance/legal-document-page";

export const metadata: Metadata = {
  title: "AMG Aviation Group — Privacy Policy",
  description: "Privacy policy for AMG Aviation Group website and portal inquiries.",
};

export default function PrivacyPolicyPage() {
  return <LegalDocumentPage slug="privacy-policy" />;
}
