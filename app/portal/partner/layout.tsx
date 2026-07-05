import { RolePortalLayout } from "@/components/portal/shell/role-layout";

export default function PartnerPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RolePortalLayout role="partner">{children}</RolePortalLayout>;
}
