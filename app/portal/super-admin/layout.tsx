import { RolePortalLayout } from "@/components/portal/shell/role-layout";

export default function SuperAdminPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RolePortalLayout role="super_admin">{children}</RolePortalLayout>;
}
