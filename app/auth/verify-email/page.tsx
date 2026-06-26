import Link from "next/link";
import { PortalAccessShell } from "@/components/site/portal-access-shell";

export const metadata = {
  title: "Verify AMG Connect Email",
  description: "Verify your AMG Connect email address.",
};

export default function VerifyEmailPage() {
  return (
    <PortalAccessShell
      eyebrow="AMG Connect"
      title="Verify your AMG Connect email."
      description="Open the latest AMG Aviation Group email and follow the secure verification button to continue."
      backHref="/login"
      backLabel="Return to login"
    >
      <Link href="/forgot-password" className="oc-btn oc-btn-light mt-6 justify-center">
        Request a new link
      </Link>
    </PortalAccessShell>
  );
}
