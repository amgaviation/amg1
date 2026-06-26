import Link from "next/link";
import { PortalAccessShell } from "@/components/site/portal-access-shell";

export const metadata = {
  title: "Reset AMG Connect Password",
  description: "Reset your AMG Aviation Group portal password.",
};

export default function AuthResetPasswordPage() {
  return (
    <PortalAccessShell
      eyebrow="AMG Connect"
      title="Reset your AMG Connect password."
      description="Enter a new password to regain access to your AMG Aviation Group portal."
      backHref="/forgot-password"
      backLabel="Request a new link"
    >
      <Link href="/reset-password" className="oc-btn oc-btn-light mt-6 justify-center">
        Set password
      </Link>
    </PortalAccessShell>
  );
}
