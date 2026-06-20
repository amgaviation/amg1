import type { Metadata } from "next";
import { LegalDocumentPage } from "@/components/compliance/legal-document-page";

export const metadata: Metadata = {
  title: "AMG Aviation Group — Credential Submission Notice",
  description: "Credential submission notice for AMG Aviation Group pilot network profiles.",
};

export default function CredentialSubmissionPage() {
  return <LegalDocumentPage slug="credential-submission" />;
}
