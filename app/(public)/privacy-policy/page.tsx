import type { Metadata } from "next";
import { LegalPage } from "@/components/site/legal-page";

export const metadata: Metadata = {
  title: "AMG Aviation Group — Privacy Policy",
  description: "Privacy policy for AMG Aviation Group website and portal inquiries.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPage eyebrow="Administrative" title="Privacy Policy">
      <p>
        AMG Aviation Group collects information submitted through website forms,
        portal access requests, pilot profile submissions, and direct inquiries
        only for review, communication, and support coordination purposes.
      </p>
      <p>
        Information may include requester details, aircraft context, crew
        credentials, route or timing details, documents, and operational notes
        relevant to a requested support scope. Access is limited to approved
        AMG personnel or authorized support participants as needed.
      </p>
      <p>
        Do not submit sensitive information unless it is necessary for AMG to
        review the request. Additional privacy terms may apply inside authenticated
        portal systems or under separate written agreements.
      </p>
    </LegalPage>
  );
}
