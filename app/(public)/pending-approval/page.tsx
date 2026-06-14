import Link from "next/link";
import { PortalAccessShell } from "@/components/site/portal-access-shell";

export const metadata = {
  title: "AMG Portal Access Pending",
  description: "AMG portal access request pending approval.",
};

export default function PendingApprovalPage() {
  return (
    <PortalAccessShell
      eyebrow="Access Review"
      title="Pending approval"
      description="AMG Operations reviews every portal account before activation. You will be notified when access is approved or if more information is required."
      backLabel="Return to login"
    >
      <Link href="/login" className="inline-flex min-h-12 items-center rounded-full bg-primary px-6 py-3 font-display text-xs font-semibold uppercase tracking-widest text-primary-foreground">
        Return to login
      </Link>
    </PortalAccessShell>
  );
}
