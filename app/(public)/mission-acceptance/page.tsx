import type { Metadata } from "next";
import { LegalDocumentPage } from "@/components/compliance/legal-document-page";

export const metadata: Metadata = {
  title: "AMG Aviation Group — Mission Acceptance Policy",
  description: "Mission acceptance policy for AMG Aviation Group support requests.",
};

export default function MissionAcceptancePage() {
  return <LegalDocumentPage slug="mission-acceptance" />;
}
