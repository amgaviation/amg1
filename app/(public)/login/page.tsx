import type { Metadata } from "next";
import { PortalLogin } from "@/components/site/portal-login";

export const metadata: Metadata = {
  title: "Member Login",
  description: "Client, crew, and admin login for AMG Connect.",
};

export default function LoginPage() {
  return <PortalLogin />;
}
