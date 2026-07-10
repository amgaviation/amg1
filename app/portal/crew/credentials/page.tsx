import Link from "next/link";
import { requireRolePermission } from "@/lib/portal/permissions";
import { PageHeader, SectionCard, EmptyState, Notice, StatCard } from "@/components/portal/ui/primitives";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { FileField, SelectField, TextField } from "@/components/portal/ui/fields";
import { addCredential } from "@/app/portal/actions/crew";
import { listCredentials } from "@/lib/portal/queries";
import { CREDENTIAL_STATUS_LABEL, CREDENTIAL_STATUS_TONE, CREDENTIAL_TYPES, toneFor } from "@/lib/portal/constants";
import { daysUntil, formatDate } from "@/lib/portal/format";

export const metadata = { title: "Credentials - Crew Portal" };

export default async function CrewCredentialsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const user = await requireRolePermission("crew", "crew");
  const params = await searchParams;
  const credentials = await listCredentials(user.id);

  const approved = credentials.filter((c) => c.status === "approved").length;
  const pending = credentials.filter((c) => c.status === "pending_review").length;
  const withExpiry = credentials
    .filter((c) => c.expiration_date)
    .map((c) => ({ ...c, days: daysUntil(c.expiration_date) ?? 0 }))
    .sort((a, b) => a.days - b.days);
  const expiringSoon = withExpiry.filter((c) => c.days >= 0 && c.days <= 90).length;
  const expired = withExpiry.filter((c) => c.days < 0).length;

  return (
    <>
      {params.success ? <Notice tone="success">Credential submitted for AMG review.</Notice> : null}
      {params.error === "missing" ? <Notice tone="danger">Credential type is required.</Notice> : null}
      {params.error === "terms" ? <Notice tone="danger">Confirm the credential and document upload notices before submitting.</Notice> : null}
      {params.error === "payment-data" ? <Notice tone="danger">Remove full card numbers, CVV codes, bank account numbers, or routing numbers before submitting.</Notice> : null}

      <PageHeader eyebrow="Flight Crew" title="Credentials" description="Upload certificates, medicals, passports, recurrent training, and insurance approvals. Stay ahead of renewals with the radar below." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Approved" value={approved} icon="badgeCheck" tone={approved ? "accent" : "default"} />
        <StatCard label="Pending review" value={pending} icon="clock" tone={pending ? "info" : "default"} />
        <StatCard
          label="Expiring ≤ 90 days"
          value={expiringSoon}
          icon="alert"
          tone={expiringSoon ? "warn" : "default"}
          detail={expiringSoon ? "Renew before assignment review" : undefined}
        />
        <StatCard label="Expired" value={expired} icon="alert" tone={expired ? "danger" : "default"} />
      </div>

      {withExpiry.length > 0 ? (
        <SectionCard
          title="Renewal Radar"
          icon="radar"
          description="Every dated credential ordered by time remaining. The bar drains as expiration approaches."
        >
          <div className="space-y-4">
            {withExpiry.map((credential) => {
              const pct = Math.max(0, Math.min(100, Math.round((credential.days / 365) * 100)));
              const barColor =
                credential.days <= 30
                  ? "var(--deck-danger)"
                  : credential.days <= 90
                    ? "var(--deck-warn)"
                    : "var(--deck-success)";
              return (
                <div key={credential.id}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-sm font-semibold text-[var(--deck-text)]">
                      {credential.credential_type}
                      {credential.identifier ? (
                        <span className="deck-mono ml-2 text-[var(--deck-text-3)]">{credential.identifier}</span>
                      ) : null}
                    </p>
                    <p
                      className={`deck-num text-xs font-semibold ${credential.days < 0 ? "text-[var(--deck-danger)]" : credential.days <= 90 ? "text-[var(--deck-warn)]" : "text-[var(--deck-text-3)]"}`}
                    >
                      {credential.days < 0
                        ? `Expired ${Math.abs(credential.days)}d ago`
                        : `${credential.days}d remaining`}{" "}
                      · {formatDate(credential.expiration_date)}
                    </p>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[var(--deck-panel-2)]">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${credential.days < 0 ? 100 : pct}%`, backgroundColor: barColor }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      ) : null}

      <SectionCard title="Submit Credential" icon="badgeCheck">
        <Notice tone="info">
          Credential uploads are reviewed for assignment suitability and do not guarantee approval or work. Upload only
          documents you are authorized to provide. Review the{" "}
          <Link href="/legal/credential-submission" className="font-semibold text-[var(--deck-accent-ink)] hover:underline">Credential Submission Notice</Link>{" "}
          and <Link href="/legal/document-upload-terms" className="font-semibold text-[var(--deck-accent-ink)] hover:underline">Document Upload Terms</Link>.
        </Notice>
        <form action={addCredential} encType="multipart/form-data" className="grid gap-4 lg:grid-cols-4">
          <SelectField label="Credential Type" name="credential_type" required defaultValue="" placeholder="Select type..." options={CREDENTIAL_TYPES.map((t) => ({ value: t, label: t }))} />
          <TextField label="Identifier" name="identifier" placeholder="Certificate or document number" />
          <TextField label="Issued Date" name="issued_date" type="date" />
          <TextField label="Expiration Date" name="expiration_date" type="date" />
          <div className="lg:col-span-3">
            <FileField label="Credential File" name="file" accept=".pdf,.jpg,.jpeg,.png" />
          </div>
          <label className="deck-inset lg:col-span-4 flex items-start gap-3 p-3 text-sm text-[var(--deck-text-2)]">
            <input name="document_terms_acknowledged" value="accepted" type="checkbox" required className="mt-1 h-4 w-4 accent-[var(--deck-accent)]" />
            <span>I acknowledge the credential submission notice and document upload terms, and I will not submit full card numbers, CVV codes, bank account numbers, routing numbers, or unrelated sensitive information.</span>
          </label>
          <div className="flex items-end">
            <SubmitButton pendingText="Submitting...">Submit Credential</SubmitButton>
          </div>
        </form>
      </SectionCard>

      <SectionCard title="Credential Record" icon="badgeCheck">
        {credentials.length === 0 ? (
          <EmptyState icon="badgeCheck" title="No credentials uploaded" description="Submit credentials above so AMG can qualify assignments quickly." />
        ) : (
          <div className="space-y-3">
            {credentials.map((credential) => {
              const days = daysUntil(credential.expiration_date);
              return (
                <div key={credential.id} className="deck-inset grid gap-3 p-4 sm:grid-cols-[1fr_auto_auto]">
                  <div>
                    <p className="text-sm font-semibold">{credential.credential_type}</p>
                    <p className="mt-1 text-xs text-[var(--deck-text-2)]">
                      {credential.identifier ?? "No identifier"} | Expires {formatDate(credential.expiration_date)}
                      {days !== null ? ` | ${days < 0 ? "Expired" : `${days} days remaining`}` : ""}
                    </p>
                  </div>
                  <StatusBadge label={CREDENTIAL_STATUS_LABEL[credential.status] ?? credential.status} tone={toneFor(CREDENTIAL_STATUS_TONE, credential.status)} />
                  {credential.document_id ? (
                    <Link href={`/portal/documents/${credential.document_id}/view`} className="text-sm text-[var(--deck-accent-ink)] hover:underline">View</Link>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>
    </>
  );
}
