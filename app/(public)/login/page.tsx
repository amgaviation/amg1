import type { Metadata } from "next";
import { PortalLogin } from "@/components/site/portal-login";

export const metadata: Metadata = {
  title: "AMG Connect — Portal Login",
  description: "Secure access for aircraft owners, flight crew, AMG operations, and aviation partners.",
  robots: { index: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; error?: string; success?: string }>;
}) {
  const params = await searchParams;
  return (
    <PortalLogin
      mode={(params.mode === "request" ? "request" : "signin") as "signin" | "request"}
      error={params.error}
      success={params.success}
    />
  );
}
