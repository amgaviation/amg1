import Link from "next/link";
import { PortalAccessShell } from "@/components/site/portal-access-shell";

export const metadata = {
  title: "AMG Connect Access Link",
  description: "AMG Connect access link status.",
};

export default function AuthErrorPage() {
  return (
    <PortalAccessShell
      eyebrow="AMG Connect"
      title="This access link is no longer valid."
      description="Request a new link or contact AMG Aviation Group for assistance."
      backHref="/login"
      backLabel="Return to login"
    >
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link href="/forgot-password" className="oc-btn oc-btn-light justify-center">
          Request a new link
        </Link>
        <Link href="/contact" className="oc-btn oc-btn-ghost-dark justify-center">
          Contact AMG
        </Link>
      </div>
    </PortalAccessShell>
  );
}
