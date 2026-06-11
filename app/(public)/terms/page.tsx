import type { Metadata } from "next";
import { LegalPage } from "@/components/site/legal-page";
import { COMPANY } from "@/lib/content";

export const metadata: Metadata = {
  title: "AMG Aviation Group — Terms & Conditions",
  description: "Terms and conditions for AMG Aviation Group website use.",
};

export default function TermsPage() {
  return (
    <LegalPage eyebrow="Administrative" title="Terms & Conditions">
      <p>
        This website provides general information about AMG Aviation Group
        support capabilities. Website content does not create a contract,
        engagement, aircraft availability commitment, crew assignment, or mission
        acceptance.
      </p>
      <p>{COMPANY.requestDisclaimer}</p>
      <p>
        Any support relationship, scope, pricing, role access, or operational
        responsibility must be reviewed and accepted separately by the applicable
        parties.
      </p>
    </LegalPage>
  );
}
