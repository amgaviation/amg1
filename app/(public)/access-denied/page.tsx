import Link from "next/link";
import { PortalAccessShell } from "@/components/site/portal-access-shell";

export const metadata = {
  title: "AMG Portal Access Denied",
  description: "AMG portal access denied or unavailable.",
};

export default function AccessDeniedPage() {
  return (
    <PortalAccessShell
      eyebrow="Portal Security"
      title="Access denied"
      description="Your account is not authorized for that portal area. AMG routes users by approved role and account status."
      backHref="/portal"
      backLabel="Go to my portal"
    >
      <Link href="/portal" className="inline-flex min-h-12 items-center rounded-full bg-primary px-6 py-3 font-display text-xs font-semibold uppercase tracking-widest text-primary-foreground">
        Go to my portal
      </Link>
    </PortalAccessShell>
  );
}
