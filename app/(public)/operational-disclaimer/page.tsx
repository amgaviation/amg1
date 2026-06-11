import type { Metadata } from "next";
import { LegalPage } from "@/components/site/legal-page";
import { COMPANY } from "@/lib/content";

export const metadata: Metadata = {
  title: "AMG Aviation Group — Operational Disclaimer",
  description: "Operational disclaimer for AMG Aviation Group support requests.",
};

export default function OperationalDisclaimerPage() {
  return (
    <LegalPage eyebrow="Administrative" title="Operational Disclaimer">
      <p>{COMPANY.disclaimer}</p>
      <p>{COMPANY.requestDisclaimer}</p>
      <p>
        AMG support activity is coordinated only within the scope reviewed and
        accepted for a particular aircraft, owner/operator, crew requirement,
        route, timing, and operating context.
      </p>
    </LegalPage>
  );
}
