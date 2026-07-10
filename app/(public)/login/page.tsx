import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PortalLogin } from "@/components/site/portal-login";
import { isPublicSignupEnabled } from "@/lib/portal/maintenance";

export const metadata: Metadata = {
  title: "AMG Connect — Portal Login",
  description: "Secure access for aircraft owners, flight crew, AMG operations, and aviation partners.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; error?: string; success?: string }>;
}) {
  const params = await searchParams;
  const publicSignupEnabled = isPublicSignupEnabled(process.env.AMG_CONNECT_PUBLIC_SIGNUP);
  if (params.mode === "request" && !publicSignupEnabled) redirect("/maintenance");

  return (
    <PortalLogin
      mode={(params.mode === "request" ? "request" : "signin") as "signin" | "request"}
      error={params.error}
      success={params.success}
      publicSignupEnabled={publicSignupEnabled}
    />
  );
}
