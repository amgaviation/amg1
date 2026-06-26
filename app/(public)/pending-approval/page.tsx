import Link from "next/link";
import { signOut } from "@/app/portal/actions/auth";
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
      <div className="grid gap-4">
        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4 text-sm leading-6 text-muted-foreground">
          <p className="font-semibold text-foreground">Under AMG review</p>
          <p className="mt-2">
            Operations is confirming your requested role, company relationship, and portal scope. Approved accounts are routed automatically to the correct AMG workspace.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/contact" className="inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-6 py-3 font-display text-xs font-semibold uppercase tracking-widest text-primary-foreground">
            Contact AMG
          </Link>
          <form action={signOut}>
            <button type="submit" className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-white/15 px-6 py-3 font-display text-xs font-semibold uppercase tracking-widest text-foreground hover:border-primary">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </PortalAccessShell>
  );
}
