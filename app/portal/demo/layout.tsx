import { RolePortalLayout } from "@/components/portal/shell/role-layout";
import { DemoModeBanner } from "@/components/portal/demo/demo-mode-banner";

export default function DemoPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RolePortalLayout role="demo">
      <DemoModeBanner />
      {children}
    </RolePortalLayout>
  );
}
