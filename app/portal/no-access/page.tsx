import Link from "next/link";
import { requireUser } from "@/lib/portal/session";
import { ROLE_HOME, isAdminRole } from "@/lib/portal/constants";
import {
  PERMISSION_ACTION_LABELS,
  PERMISSION_MODULES,
  isPermissionModule,
  type PermissionAction,
} from "@/lib/portal/permissions-catalog";

export const metadata = {
  title: "No Access - AMG Portal",
  description: "This portal area is not enabled for your role.",
};

function isStrongAction(value: string | undefined): value is Exclude<PermissionAction, "view"> {
  return value === "add" || value === "edit" || value === "delete";
}

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

  // A denied add/edit/delete on a module the user can still view reads very
  // differently from a full lockout — say which one it is.
  const strongAction = isStrongAction(params.action) ? params.action : null;
  const description = moduleInfo
    ? strongAction
      ? `Your account can view ${moduleInfo.label}, but ${PERMISSION_ACTION_LABELS[strongAction].toLowerCase()} is not enabled for your role.`
      : `Your account doesn't currently have access to ${moduleInfo.label}.`
    : "Your account doesn't currently have access to that portal area.";

  const reviewer = isAdminRole(user.role)
    ? "your Super Admin (Website Governance)"
    : "AMG Operations";

  return (
    <main className="amg-portal min-h-screen px-5 py-8 lg:px-8">
      <div className="mx-auto flex min-h-[70vh] w-full max-w-6xl items-center justify-center">
        <section className="deck-card w-full max-w-xl p-6">
          <p className="deck-eyebrow">Portal Access</p>
          <h1 className="deck-title mt-2 text-2xl">
            {strongAction ? "That action isn't enabled for your role" : "That area isn't enabled for your role"}
          </h1>
          <p className="mt-3 text-sm leading-6 text-[var(--deck-text-2)]">{description}</p>
          <div className="deck-inset mt-6 p-4 text-sm leading-6 text-[var(--deck-text-2)]">
            <p className="font-semibold text-[var(--deck-text)]">Nothing is broken</p>
            <p className="mt-2">
              AMG enables portal areas per role. If you need this for your work with AMG, ask{" "}
              {reviewer} to review your access — permission changes apply immediately.
            </p>
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href={home}
              className="inline-flex min-h-12 items-center justify-center rounded-lg bg-[var(--deck-navy)] px-6 text-sm font-semibold text-[var(--deck-on-ink)] transition-colors hover:bg-[var(--deck-navy-2)]"
            >
              Back to my dashboard
            </Link>
            <Link
              href="/contact"
              className="inline-flex min-h-12 items-center justify-center rounded-md border border-[var(--deck-line-strong)] px-6 text-sm font-semibold text-[var(--deck-text)] transition-colors hover:border-[var(--deck-accent-line)] hover:bg-[var(--deck-accent-tint)]"
            >
              Contact AMG
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
