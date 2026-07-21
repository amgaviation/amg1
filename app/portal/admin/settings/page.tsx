import Link from "next/link";
import { requireRole } from "@/lib/portal/session";
import { permissionsForRole } from "@/lib/portal/permissions";
import { MATRIX_ROLES, type ActionFlags, type MatrixRole, type PermissionModule } from "@/lib/portal/permissions-catalog";
import { saveRolePermissions } from "@/app/portal/actions/permissions";
import { AccountSecurityForm } from "@/components/portal/account-security-form";
import { PermissionsMatrix } from "@/components/portal/admin/permissions-matrix";
import { DetailRow, Notice, PageHeader, SectionCard } from "@/components/portal/ui/primitives";
import { PageTabs, activeTab } from "@/components/portal/ui/page-tabs";
import { RoleBadge } from "@/components/portal/ui/status-badge";

export const metadata = { title: "Settings - Admin Portal" };

const BASE_PATH = "/portal/admin/settings";

const TAB_OPTIONS = [
  { label: "Account", value: "account" },
  { label: "Login & Security", value: "security" },
  { label: "Permissions", value: "permissions" },
  { label: "Billing", value: "billing" },
  { label: "FlightWall", value: "flightwall" },
  { label: "Email Templates", value: "email-templates" },
  { label: "Compliance", value: "compliance" },
  { label: "Operational", value: "operational" },
];

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; accountSuccess?: string; accountError?: string }>;
}) {
  // Intentionally role-gated, not module-gated: this page carries the admin's
  // personal account security form, which must stay reachable even when the
  // settings module is hidden from the nav.
  const user = await requireRole("admin");
  const params = await searchParams;
  const tab = activeTab(params.tab, TAB_OPTIONS);

  const accountErrorMessage =
    params.accountError === "missing-email"
      ? "Enter an email address."
      : params.accountError === "same-email"
        ? "Use a different email address."
        : params.accountError === "weakpassword"
          ? "Password must be at least 8 characters."
          : params.accountError === "mismatch"
            ? "The password confirmation does not match."
            : params.accountError
              ? "The account change could not be completed."
              : null;

  // The permission matrix is the only heavy data load on this page — fetch it
  // only when that tab is active. Same loading as the standalone
  // /portal/admin/settings/permissions page.
  let permissionsInitial: Record<MatrixRole, Record<PermissionModule, ActionFlags>> | null = null;
  if (tab === "permissions") {
    const initial = {} as Record<MatrixRole, Record<PermissionModule, ActionFlags>>;
    for (const role of MATRIX_ROLES) {
      initial[role] = await permissionsForRole(role);
    }
    permissionsInitial = initial;
  }

  return (
    <>
      {params.accountSuccess === "email" ? <Notice tone="success">Email change saved. Check your inbox if confirmation is required.</Notice> : null}
      {params.accountSuccess === "password" ? <Notice tone="success">Password updated for this portal account.</Notice> : null}
      {accountErrorMessage ? <Notice tone="danger">{accountErrorMessage}</Notice> : null}
      <PageHeader eyebrow="AMG Operations" title="Settings" description="Current administrator account and production readiness checks." />
      <PageTabs basePath={BASE_PATH} current={params.tab} options={TAB_OPTIONS} />

      {tab === "account" ? (
        <SectionCard title="Account" icon="settings">
          <dl>
            <DetailRow label="Name">{user.name}</DetailRow>
            <DetailRow label="Email">{user.email}</DetailRow>
            <DetailRow label="Role"><RoleBadge role={user.role} /></DetailRow>
            <DetailRow label="Status">{user.status}</DetailRow>
          </dl>
        </SectionCard>
      ) : null}

      {tab === "security" ? (
        <>
          <AccountSecurityForm email={user.email} backTo={BASE_PATH} />
          <SectionCard
            title="Security Review"
            icon="badgeCheck"
            description="Recurring check of account security and role permissions."
          >
            <p className="text-sm text-[var(--deck-text-2)]">
              <Link href="/portal/admin/security-review" className="text-[var(--deck-accent-ink)] hover:underline">
                Complete monthly account security and permission review
              </Link>
            </p>
          </SectionCard>
        </>
      ) : null}

      {tab === "permissions" && permissionsInitial ? (
        <SectionCard
          title="Permission Matrix"
          icon="shield"
          description="Control what each portal role can view, add, edit, and delete, module by module."
        >
          <div className="mb-4 grid gap-1 text-xs text-[var(--deck-text-2)]">
            <p>View covers lists, search, and detail pages. Copy/duplicate follows Add.</p>
            <p>
              The Super Admin always has full access and never appears here, so governance can never be
              locked out. Ownership rules (own records only) still apply on top of these switches.
            </p>
            <p>
              Saving applies to all active portal sessions immediately — there is no preview. Removing
              View from the AMG Operations row hides that area from every admin; the Super Admin can
              restore access here or with Restore defaults.
            </p>
            <p>
              <Link href="/portal/admin/settings/permissions" className="text-[var(--deck-accent-ink)] hover:underline">
                Open the standalone role permissions page
              </Link>
            </p>
          </div>
          <PermissionsMatrix
            initial={permissionsInitial}
            canEdit={user.role === "super_admin"}
            action={saveRolePermissions}
          />
        </SectionCard>
      ) : null}

      {tab === "billing" ? (
        <SectionCard
          title="Billing"
          icon="creditCard"
          description="Billing settings are protected by an additional access check and open on their own page."
        >
          <p className="text-sm text-[var(--deck-text-2)]">
            <Link href="/portal/admin/settings/billing" className="text-[var(--deck-accent-ink)] hover:underline">
              Manage protected billing settings
            </Link>
          </p>
        </SectionCard>
      ) : null}

      {tab === "flightwall" ? (
        <SectionCard
          title="FlightWall Dashboard"
          icon="radar"
          description="The wall-display ops dashboard shown on the office TV — traffic map view, panels, watchlist, refresh rate."
        >
          <div className="grid gap-3 text-sm text-[var(--deck-text-2)]">
            <p>
              Configure the map region (Florida, Continental USA, or a custom view), basemap style, home base,
              watchlisted tail numbers, panel layout, and polling cadence. Changes apply on the dashboard&rsquo;s
              next load — no redeploy.
            </p>
            <p>
              <Link href="/portal/admin/settings/flightwall" className="text-[var(--deck-accent-ink)] hover:underline">
                Configure the FlightWall dashboard
              </Link>
              {" · "}
              <Link href="/ops/flightwall" target="_blank" rel="noopener" className="text-[var(--deck-accent-ink)] hover:underline">
                Open the live display
              </Link>
            </p>
          </div>
        </SectionCard>
      ) : null}

      {tab === "email-templates" ? (
        <SectionCard title="Email Templates" icon="mail">
          <div className="grid gap-3 text-sm text-[var(--deck-text-2)]">
            <p>
              Edit the copy of every templated email the portal sends — crew communications,
              sales-pipeline lead outreach, Crew Network application decisions, and
              communications-composer starters. Saved changes apply globally and immediately.
            </p>
            <p>
              <Link href="/portal/admin/settings/email-templates" className="text-[var(--deck-accent-ink)] hover:underline">
                Edit email templates
              </Link>
            </p>
          </div>
        </SectionCard>
      ) : null}

      {tab === "compliance" ? (
        <SectionCard
          title="Compliance"
          icon="fileText"
          description="Compliance tooling lives in the dedicated compliance area of the admin portal."
        >
          <p className="text-sm text-[var(--deck-text-2)]">
            <Link href="/portal/admin/compliance" className="text-[var(--deck-accent-ink)] hover:underline">
              Review legal notices, privacy requests, consent events, and compliance controls
            </Link>
          </p>
        </SectionCard>
      ) : null}

      {tab === "operational" ? (
        <SectionCard title="Operational Configuration" icon="clipboard">
          <div className="grid gap-3 text-sm text-[var(--deck-text-2)]">
            <p>Authentication, profile approval, portal role routing, document storage, audit logging, notifications, and server actions are wired in this build.</p>
            <p>Before production launch, confirm protected storage buckets exist for documents and crew-credentials, then set the required production environment variables.</p>
          </div>
        </SectionCard>
      ) : null}
    </>
  );
}
