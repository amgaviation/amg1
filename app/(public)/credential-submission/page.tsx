import type { Metadata } from "next";
import { LegalPage } from "@/components/site/legal-page";

export const metadata: Metadata = {
  title: "AMG Aviation Group — Credential Submission Notice",
  description: "Credential submission notice for AMG Aviation Group pilot network profiles.",
};

export default function CredentialSubmissionPage() {
  return (
    <LegalPage eyebrow="Administrative" title="Credential Submission Notice">
      <p>
        Submitting a pilot profile, credential packet, or availability update
        does not guarantee approval, assignment, compensation, engagement, or
        future work.
      </p>
      <p>
        All pilot and crew participation remains subject to credential review,
        aircraft qualifications, assignment suitability, owner/operator
        requirements, insurance requirements, mission-specific approval, and any
        separate written engagement terms that may apply.
      </p>
    </LegalPage>
  );
}
