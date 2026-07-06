import Link from "next/link";
import { requireRole } from "@/lib/portal/session";
import {
  FilterTabs,
  Notice,
  PageHeader,
  SectionCard,
} from "@/components/portal/ui/primitives";
import { TextAreaField, TextField } from "@/components/portal/ui/fields";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { Button } from "@/components/ui/button";
import { resetEmailTemplate, saveEmailTemplate } from "@/app/portal/actions/email-templates";
import {
  EMAIL_TEMPLATE_FAMILIES,
  listEmailTemplates,
} from "@/lib/portal/email-template-registry";
import { formatDateTime } from "@/lib/portal/format";

export const metadata = { title: "Email Templates - AMG Operations" };
export const dynamic = "force-dynamic";

export default async function EmailTemplatesPage({
  searchParams,
}: {
  searchParams: Promise<{ family?: string; q?: string; success?: string; error?: string }>;
}) {
  await requireRole("admin");
  const params = await searchParams;
  const templates = await listEmailTemplates();

  const family = params.family ?? "";
  const q = (params.q ?? "").toLowerCase();
  const filtered = templates.filter((template) => {
    if (family && template.family !== family) return false;
    if (q) {
      return [template.name, template.key, template.subject]
        .some((value) => value.toLowerCase().includes(q));
    }
    return true;
  });

  const backTo = `/portal/admin/settings/email-templates${family || params.q ? `?${new URLSearchParams({ ...(family ? { family } : {}), ...(params.q ? { q: params.q } : {}) })}` : ""}`;
  const overriddenCount = templates.filter((template) => template.overridden).length;

  return (
    <>
      {params.success === "saved" ? <Notice tone="success">Template saved. Every email sent from now on uses the new copy.</Notice> : null}
      {params.success === "reset" ? <Notice tone="success">Template restored to the shipped default.</Notice> : null}
      {params.error === "missing" ? <Notice tone="danger">Subject and body are both required.</Notice> : null}
      {params.error === "unknown" ? <Notice tone="danger">That template could not be found.</Notice> : null}
      {params.error === "save" ? <Notice tone="danger">The template could not be saved.</Notice> : null}

      <PageHeader
        eyebrow="AMG Operations"
        title="Email Templates"
        description="Edit the copy of every templated email the portal sends — crew communications, lead outreach, Crew Network decisions, and composer starters. Saving applies globally and immediately."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/portal/admin/settings">← Settings</Link>
          </Button>
        }
      />

      <div className="flex flex-col gap-3">
        <FilterTabs
          basePath="/portal/admin/settings/email-templates"
          param="family"
          current={family}
          preserve={{ q: params.q }}
          options={[
            { value: "", label: `All (${templates.length})` },
            ...EMAIL_TEMPLATE_FAMILIES.map((entry) => ({
              value: entry.value,
              label: `${entry.label} (${templates.filter((t) => t.family === entry.value).length})`,
            })),
          ]}
        />
        <form className="flex flex-wrap items-center gap-2">
          {family ? <input type="hidden" name="family" value={family} /> : null}
          <input
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Template name, key, subject…"
            aria-label="Search templates"
            className="deck-input min-w-[12rem] flex-1 sm:max-w-xs"
          />
          <Button type="submit" size="sm">
            Search
          </Button>
          {params.q ? (
            <Link
              href={family ? `/portal/admin/settings/email-templates?family=${family}` : "/portal/admin/settings/email-templates"}
              className="rounded-md border border-[var(--deck-line-strong)] bg-[var(--deck-panel)] px-3.5 py-1.5 text-xs font-medium text-[var(--deck-text-2)] transition-colors hover:border-[var(--deck-accent-line)] hover:bg-[var(--deck-accent-tint)]"
            >
              Clear
            </Link>
          ) : null}
          <span className="deck-micro ml-auto text-[var(--deck-text-3)]">
            {filtered.length} / {templates.length} templates · {overriddenCount} customized
          </span>
        </form>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-md border border-dashed border-[var(--deck-line-strong)] bg-[var(--deck-panel-2)] px-4 py-10 text-center text-sm text-[var(--deck-text-3)]">
          No templates match the current filters.
        </p>
      ) : (
        <div className="grid gap-3">
          {filtered.map((template) => (
            <details key={template.key} className="deck-card group overflow-hidden" id={template.key}>
              <summary className="flex cursor-pointer flex-wrap items-center gap-3 px-4 py-3.5 [&::-webkit-details-marker]:hidden">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-[var(--deck-text)]">
                    {template.name}
                  </span>
                  <span className="deck-mono block truncate text-[0.66rem] text-[var(--deck-text-3)]">
                    {template.key}
                  </span>
                </span>
                {template.overridden ? (
                  <StatusBadge label="Customized" tone="accent" />
                ) : template.custom ? (
                  <StatusBadge label="Custom" tone="info" />
                ) : (
                  <StatusBadge label="Default" tone="neutral" />
                )}
                <span className="text-xs text-[var(--deck-text-3)] transition-transform group-open:rotate-90">
                  ›
                </span>
              </summary>
              <div className="border-t border-[var(--deck-line)] px-4 py-4">
                <p className="text-xs leading-5 text-[var(--deck-text-3)]">{template.description}</p>
                {template.variables.length ? (
                  <p className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="deck-eyebrow !text-[0.56rem] !text-[var(--deck-text-3)]">Variables</span>
                    {template.variables.map((variable) => (
                      <code
                        key={variable}
                        className="deck-mono rounded-[0.25rem] bg-[var(--deck-accent-tint)] px-1.5 py-0.5 text-[0.66rem] text-[var(--deck-accent-ink)]"
                      >{`{{${variable}}}`}</code>
                    ))}
                  </p>
                ) : null}
                <form action={saveEmailTemplate} className="mt-4 grid gap-4">
                  <input type="hidden" name="template_key" value={template.key} />
                  <input type="hidden" name="back_to" value={backTo} />
                  <TextField label="Subject" name="subject" required defaultValue={template.subject} />
                  <TextAreaField label="Body" name="body" required rows={12} defaultValue={template.body} />
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="text-[0.7rem] text-[var(--deck-text-3)]">
                      {template.overridden && template.updatedAt
                        ? `Customized ${formatDateTime(template.updatedAt)}`
                        : template.custom
                          ? "Stored template (no shipped default)."
                          : "Using the shipped default."}
                    </span>
                    <SubmitButton pendingText="Saving…">Save Globally</SubmitButton>
                  </div>
                </form>
                {template.overridden && !template.custom ? (
                  <form action={resetEmailTemplate} className="mt-3 flex justify-end">
                    <input type="hidden" name="template_key" value={template.key} />
                    <input type="hidden" name="back_to" value={backTo} />
                    <SubmitButton
                      variant="outline"
                      size="sm"
                      pendingText="Restoring…"
                      confirm="Discard the customized copy and restore this template's shipped default?"
                    >
                      Restore Default
                    </SubmitButton>
                  </form>
                ) : null}
              </div>
            </details>
          ))}
        </div>
      )}

      <SectionCard title="What's Covered" icon="mail">
        <div className="grid gap-2 text-sm text-[var(--deck-text-2)]">
          <p>
            These templates cover every editable email: crew communications, sales-pipeline lead
            outreach (per stage and business type), Crew Network application decisions, the waitlist
            contact request, and the communications-composer starters.
          </p>
          <p>
            Data-driven system emails — invoices, receipts, quote PDFs, account setup, and portal
            notifications — assemble their content from live records and are not free-text editable.
            Variables in <code className="deck-mono text-[0.72rem]">{"{{double_braces}}"}</code> are
            filled in automatically when each email is sent; unknown variables are left as-is.
          </p>
        </div>
      </SectionCard>
    </>
  );
}
