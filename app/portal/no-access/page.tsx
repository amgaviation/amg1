import Link from "next/link";
import { requireUser } from "@/lib/portal/session";
import { ROLE_HOME } from "@/lib/portal/constants";
import { PERMISSION_MODULES, isPermissionModule } from "@/lib/portal/permissions-catalog";
import { PortalAccessShell } from "@/components/site/portal-access-shell";

export const metadata = {
  title: "No Access - AMG Portal",
  description: "This portal area is not enabled for your role.",
};

/**
 * Friendly landing spot when the role-permission matrix denies a module or
 * action — a clear notice with a way back, not an error page.
 */
export default async function NoAccessPage({
  searchParams,
}: {
  searchParams: Promise<{ module?: string; action?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const moduleInfo = isPermissionModule(params.module)
    ? PERMISSION_MODULES.find((m) => m.key === params.module)
    : undefined;
  const home = ROLE_HOME[user.role];

  return (
    <PortalAccessShell
      eyebrow="Portal Access"
      title="That area isn't enabled for your role"
      description={
        moduleInfo
          ? `Your account doesn't currently have access to ${moduleInfo.label}.`
          : "Your account doesn't currently have access to that portal area."
      }
      backHref={home}
      backLabel="Back to my dashboard"
    >
      <div className="grid gap-4">
        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4 text-sm leading-6 text-muted-foreground">
          <p className="font-semibold text-foreground">Nothing is broken</p>
          <p className="mt-2">
            AMG enables portal areas per role. If you need this for your work with AMG, ask
            Operations to review your access — permission changes apply immediately.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href={home}
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-6 py-3 font-display text-xs font-semibold uppercase tracking-widest text-primary-foreground"
          >
            Back to my dashboard
          </Link>
          <Link
            href="/contact"
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/15 px-6 py-3 font-display text-xs font-semibold uppercase tracking-widest text-foreground hover:border-primary"
          >
            Contact AMG
          </Link>
        </div>
      </div>
    </PortalAccessShell>
  );
}
