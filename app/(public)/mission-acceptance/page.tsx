import type { Metadata } from "next";
import { LegalPage } from "@/components/site/legal-page";

export const metadata: Metadata = {
  title: "AMG Aviation Group — Mission Acceptance Policy",
  description: "Mission acceptance policy for AMG Aviation Group support requests.",
};

export default function MissionAcceptancePage() {
  return (
    <LegalPage eyebrow="Administrative" title="Mission Acceptance Policy">
      <p>
        A Support Request is an intake step only. AMG may review aircraft status,
        maintenance status, crew availability, credential suitability, insurance
        requirements, weather, airport restrictions, route complexity, timing,
        documentation, and owner/operator approval before any support is accepted.
      </p>
      <p>
        No request should be treated as approved until AMG confirms the accepted
        scope and the applicable owner/operator responsibilities remain clear.
      </p>
    </LegalPage>
  );
}
