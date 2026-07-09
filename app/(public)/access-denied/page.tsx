import Link from "next/link";
import { PortalAccessShell } from "@/components/site/portal-access-shell";

export const metadata = {
  title: "AMG Portal Access Denied",
  description: "AMG portal access denied or unavailable.",
  robots: { index: false },
};

export default function AccessDeniedPage() {
  return (
    <PortalAccessShell
      eyebrow="Portal Security"
      title="Access denied"
      description="Your account is not authorized for that portal area. AMG routes users by approved role and account status."
      backHref={null}
    >
      <div className="grid gap-4">
        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4 text-sm leading-6 text-muted-foreground">
          <p className="font-semibold text-foreground">Role-based access required</p>
          <p className="mt-2">
            If your AMG role or company relationship recently changed, contact Operations so your portal access can be reviewed.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/portal" className="oc-btn oc-btn-primary justify-center">
            Go to my portal
          </Link>
          <Link href="/contact" className="oc-btn oc-btn-ghost-dark justify-center">
            Contact AMG
          </Link>
        </div>
      </div>
    </PortalAccessShell>
  );
}
