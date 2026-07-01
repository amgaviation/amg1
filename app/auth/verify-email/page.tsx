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
      description="Open the latest AMG Aviation Group email, copy the verification code, and enter it on the AMG verification page."
      backHref="/login"
      backLabel="Return to login"
    >
      <Link href="/verify-email" className="oc-btn oc-btn-light mt-6 justify-center">
        Open verification page
      </Link>
    </PortalAccessShell>
  );
}
