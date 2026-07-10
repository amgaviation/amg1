import { PortalSetupForm } from "./portal-setup-form";
import { PortalAccessShell } from "@/components/site/portal-access-shell";

export const metadata = {
  title: "AMG Portal Access Setup",
  description: "Set up access for your AMG client portal account.",
  robots: { index: false },
};

export default function PortalSetupPage() {
  return (
    <PortalAccessShell
      eyebrow="AMG Portal"
      title="Portal access"
      description="Use the secure setup link from your AMG email to finish portal access setup."
    >
      <PortalSetupForm />
    </PortalAccessShell>
  );
}
