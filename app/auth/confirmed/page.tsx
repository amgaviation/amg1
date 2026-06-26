import Link from "next/link";
import { PortalAccessShell } from "@/components/site/portal-access-shell";

export const metadata = {
  title: "AMG Connect Email Verified",
  description: "Your AMG Connect access has been verified.",
};

export default function AuthConfirmedPage() {
  return (
    <PortalAccessShell
      eyebrow="AMG Connect"
      title="Your AMG Connect access has been verified."
      description="Your email is confirmed. You may continue to AMG Connect."
    >
      <Link href="/login" className="oc-btn oc-btn-light mt-6 justify-center">
        Continue to AMG Connect
      </Link>
    </PortalAccessShell>
  );
}
