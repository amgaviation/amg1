import { RolePortalLayout } from "@/components/portal/shell/role-layout";

export default function AdminPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RolePortalLayout role="admin">{children}</RolePortalLayout>;
}
