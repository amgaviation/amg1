import type { Metadata } from "next";
import { LegalDocumentPage } from "@/components/compliance/legal-document-page";

export const metadata: Metadata = {
  title: "AMG Aviation Group — Operational Disclaimer",
  description: "Operational disclaimer for AMG Aviation Group support requests.",
};

export default function OperationalDisclaimerPage() {
  return <LegalDocumentPage slug="mission-acceptance" />;
}
