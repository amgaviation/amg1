import type { Metadata } from "next";
import { PortalLogin } from "@/components/site/portal-login";

export const metadata: Metadata = {
  title: "AMG Aviation Group — Portal Login",
  description: "Client, crew, and admin portal login for AMG Connect aircraft support workflows.",
};

export default function LoginPage() {
  return <PortalLogin />;
}
