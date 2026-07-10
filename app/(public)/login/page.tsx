import type { Metadata } from "next";
import { PortalLogin } from "@/components/site/portal-login";

export const metadata: Metadata = {
  title: "AMG Connect — Portal Login",
  description: "Secure access for aircraft owners, flight crew, AMG operations, and aviation partners.",
  robots: { index: false },
};

// mode/error/success are read client-side inside PortalLogin (useSearchParams),
// so this page prerenders statically instead of going dynamic per request.
export default function LoginPage() {
  return <PortalLogin />;
}
