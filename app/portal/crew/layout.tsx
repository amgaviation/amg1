import { RolePortalLayout } from "@/components/portal/shell/role-layout";

export default function CrewPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RolePortalLayout role="crew">{children}</RolePortalLayout>;
}
