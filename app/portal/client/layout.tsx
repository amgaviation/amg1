import { RolePortalLayout } from "@/components/portal/shell/role-layout";

export default function ClientPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RolePortalLayout role="client">{children}</RolePortalLayout>;
}
