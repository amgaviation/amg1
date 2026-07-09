import { permanentRedirect } from "next/navigation";

// This route historically rendered the "Support Request and Mission Acceptance
// Disclaimer" (slug: mission-acceptance) under a mismatched "Operational
// Disclaimer" title/metadata. There is no separate operational-disclaimer legal
// document, so redirect to the correctly titled canonical page instead of
// serving mislabeled legal content under the wrong heading.
export default function OperationalDisclaimerPage() {
  permanentRedirect("/mission-acceptance");
}
