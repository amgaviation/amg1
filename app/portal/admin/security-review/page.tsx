import Link from "next/link";
import { requireRolePermission } from "@/lib/portal/permissions";
import { DataTable } from "@/components/portal/ui/data-table";
import { Notice, PageHeader, SectionCard } from "@/components/portal/ui/primitives";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { SelectField, TextAreaField, TextField } from "@/components/portal/ui/fields";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { listAllUsers } from "@/lib/portal/queries";
import { PROFILE_STATUS_LABEL, PROFILE_STATUS_TONE, toneFor } from "@/lib/portal/constants";
import { formatDateTime } from "@/lib/portal/format";
import { completeAdminSecurityReview } from "@/app/portal/actions/compliance";

export const metadata = { title: "Security Review - Admin Portal" };

const PAGE_SIZE = 20;
const ROLE_OPTIONS = ["client", "crew", "partner", "admin", "super_admin"];

function hrefWith(params: Record<string, string | number | null | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && value !== "") search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `/portal/admin/security-review?${query}` : "/portal/admin/security-review";
}

function isInvalidImportEmail(email: string) {
  return /@crew-import\.amg\.invalid$/.test(email) || email.includes("crew-import-");
}

function sensitiveAccess(role: string) {
  return role === "admin" || role === "super_admin";
}

export default async function AdminSecurityReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; q?: string; role?: string; status?: string; sensitive?: string; invalid_email?: string; pending?: string; page?: string }>;
}) {
  const user = await requireRolePermission("admin", "compliance");
  const params = await searchParams;
  const users = await listAllUsers();
  const currentPage = Math.max(1, Number(params.page ?? "1") || 1);
  const filtered = users.filter((row) => {
    const q = params.q?.trim().toLowerCase();
    if (q) {
      const haystack = [row.full_name, row.email, row.company_name, row.role, row.status].filter(Boolean).join(" ").toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    if (params.role && row.role !== params.role) return false;
    if (params.status && row.status !== params.status) return false;
    if (params.sensitive === "true" && !sensitiveAccess(row.role)) return false;
    if (params.sensitive === "false" && sensitiveAccess(row.role)) return false;
    if (params.invalid_email === "true" && !isInvalidImportEmail(row.email)) return false;
    if (params.pending === "true" && row.status !== "pending") return false;
    return true;
  });
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, pageCount);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const sharedParams = {
    q: params.q,
    role: params.role,
    status: params.status,
    sensitive: params.sensitive,
    invalid_email: params.invalid_email,
    pending: params.pending,
  };
  const hasFilters = Boolean(params.q || params.role || params.status || params.sensitive || params.invalid_email || params.pending);

  return (
    <>
      {params.success === "reviewed" ? <Notice tone="success">Admin access review recorded in compliance evidence.</Notice> : null}
      <Notice tone="warn">
        MFA is not currently enforced by this portal UI. Verify Supabase Auth MFA enrollment and enforcement before
        production use of sensitive portal workflows.
      </Notice>
      <PageHeader
        eyebrow="AMG Operations"
        title="Security Review"
        description="Monthly account, role, status, sensitive access, and MFA-readiness review for portal users."
      />

      <SectionCard title="Actionable Checklist" icon="shield" bodyClassName="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {[
          "Supabase MFA enrollment/enforcement verified",
          "Admin MFA required",
          "Super Admin MFA required",
          "Sensitive roles reviewed",
          "Pending users reviewed",
          "Invalid imported emails resolved",
        ].map((item) => (
          <div key={item} className="rounded-lg border border-[var(--deck-warn-line)] bg-[var(--deck-warn-tint)] px-4 py-3 text-sm text-[var(--deck-warn)]">
            {item}
          </div>
        ))}
      </SectionCard>

      <SectionCard title="Review Filters" icon="settings">
        <form className="grid gap-4 lg:grid-cols-6">
          <TextField label="Search" name="q" defaultValue={params.q ?? ""} placeholder="Name, email, company, role" />
          <SelectField label="Role" name="role" defaultValue={params.role ?? ""} options={[{ value: "", label: "All roles" }, ...ROLE_OPTIONS.map((role) => ({ value: role, label: role.replace("_", " ") }))]} />
          <SelectField label="Status" name="status" defaultValue={params.status ?? ""} options={[{ value: "", label: "All statuses" }, ...Object.entries(PROFILE_STATUS_LABEL).map(([value, label]) => ({ value, label }))]} />
          <SelectField label="Sensitive Access" name="sensitive" defaultValue={params.sensitive ?? ""} options={[{ value: "", label: "All access" }, { value: "true", label: "Sensitive access" }, { value: "false", label: "Standard access" }]} />
          <SelectField label="Invalid Email" name="invalid_email" defaultValue={params.invalid_email ?? ""} options={[{ value: "", label: "All emails" }, { value: "true", label: "Invalid import email" }]} />
          <SelectField label="Pending Approval" name="pending" defaultValue={params.pending ?? ""} options={[{ value: "", label: "All users" }, { value: "true", label: "Pending only" }]} />
          <div className="flex flex-wrap items-end gap-3 lg:col-span-6">
            <button type="submit" className="rounded-md bg-[var(--deck-accent)] px-4 py-2 text-xs font-semibold text-[var(--deck-accent-ink)] transition-colors hover:bg-[var(--deck-accent)]/90">
              Apply Filters
            </button>
            {hasFilters ? (
              <Link href="/portal/admin/security-review" className="rounded-md border border-border bg-[var(--deck-panel)] px-4 py-2 text-xs font-semibold text-[var(--deck-text-2)] hover:border-[var(--deck-accent-line)] hover:bg-[var(--deck-accent-tint)]">
                Clear filters
              </Link>
            ) : null}
            <p className="text-xs text-[var(--amg-text-muted)]">{filtered.length} of {users.length} users shown</p>
          </div>
        </form>
      </SectionCard>

      <SectionCard title="Account Review" icon="shield">
        <DataTable
          rows={paged}
          getKey={(row) => row.id}
          emptyLabel="No portal users found."
          columns={[
            { header: "User", cell: (row) => <div><p className="font-semibold">{row.full_name ?? row.email}</p><p className="text-xs text-muted-foreground">{row.email}</p></div> },
            { header: "Role", cell: (row) => row.role },
            { header: "Status", cell: (row) => <StatusBadge label={PROFILE_STATUS_LABEL[row.status] ?? row.status} tone={toneFor(PROFILE_STATUS_TONE, row.status)} /> },
            { header: "MFA", cell: () => <div><p>MFA status unavailable</p><p className="text-xs text-muted-foreground">Auth provider does not expose MFA state to this profile record.</p></div> },
            { header: "Sensitive Access", cell: (row) => sensitiveAccess(row.role) ? <StatusBadge label="Review required" tone="warn" /> : "Standard portal access" },
            { header: "Email Quality", cell: (row) => isInvalidImportEmail(row.email) ? <StatusBadge label="Invalid import placeholder" tone="danger" /> : "Verified format" },
            { header: "Created", cell: (row) => formatDateTime(row.created_at) },
          ]}
        />
      </SectionCard>
      {filtered.length > PAGE_SIZE ? (
        <div className="flex flex-col gap-3 rounded-lg border border-[var(--deck-line)] bg-[var(--deck-panel)] px-5 py-4 text-sm text-[var(--deck-text-3)] shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:flex-row sm:items-center sm:justify-between">
          <span>Page {safePage} of {pageCount}</span>
          <div className="flex gap-2">
            <Link
              aria-disabled={safePage <= 1}
              href={safePage <= 1 ? "#" : hrefWith({ ...sharedParams, page: safePage - 1 })}
              className={`rounded-md border border-border px-4 py-2 text-xs font-semibold ${safePage <= 1 ? "pointer-events-none opacity-50" : "text-[var(--deck-text-2)] hover:border-[var(--deck-accent-line)] hover:bg-[var(--deck-accent-tint)]"}`}
            >
              Previous
            </Link>
            <Link
              aria-disabled={safePage >= pageCount}
              href={safePage >= pageCount ? "#" : hrefWith({ ...sharedParams, page: safePage + 1 })}
              className={`rounded-md border border-border px-4 py-2 text-xs font-semibold ${safePage >= pageCount ? "pointer-events-none opacity-50" : "text-[var(--deck-text-2)] hover:border-[var(--deck-accent-line)] hover:bg-[var(--deck-accent-tint)]"}`}
            >
              Next
            </Link>
          </div>
        </div>
      ) : null}

      <SectionCard title="Complete Monthly Review" icon="clipboard">
        <form action={completeAdminSecurityReview} className="grid gap-4">
          <TextAreaField
            label="Review Notes"
            name="notes"
            placeholder="Accounts reviewed, stale accounts identified, role changes needed, MFA follow-up, suspended users checked..."
          />
          <SubmitButton pendingText="Recording...">Mark Review Completed</SubmitButton>
        </form>
      </SectionCard>
    </>
  );
}
