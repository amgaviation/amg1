import Link from "next/link";
import { requireRole } from "@/lib/portal/session";
import { PortalShell } from "@/components/portal/shell/portal-shell";
import { PageHeader, SectionCard, EmptyState, Notice } from "@/components/portal/ui/primitives";
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
  const user = await requireRole("crew");
  const params = await searchParams;
  const credentials = await listCredentials(user.id);

  return (
    <PortalShell role="crew" user={user}>
      {params.success ? <Notice tone="success">Credential submitted for AMG review.</Notice> : null}
      {params.error === "missing" ? <Notice tone="danger">Credential type is required.</Notice> : null}

      <PageHeader eyebrow="Flight Crew" title="Credentials" description="Upload certificates, medicals, passports, recurrent training, and insurance approvals." />

      <SectionCard title="Submit Credential" icon="badgeCheck">
        <Notice tone="info">
          Credential uploads are reviewed for assignment suitability and do not guarantee approval or work. Upload only
          documents you are authorized to provide. Review the{" "}
          <Link href="/legal/credential-submission" className="font-semibold text-accent hover:underline">Credential Submission Notice</Link>{" "}
          and <Link href="/legal/document-upload-terms" className="font-semibold text-accent hover:underline">Document Upload Terms</Link>.
        </Notice>
        <form action={addCredential} encType="multipart/form-data" className="grid gap-4 lg:grid-cols-4">
          <SelectField label="Credential Type" name="credential_type" required defaultValue="" placeholder="Select type..." options={CREDENTIAL_TYPES.map((t) => ({ value: t, label: t }))} />
          <TextField label="Identifier" name="identifier" placeholder="Certificate or document number" />
          <TextField label="Issued Date" name="issued_date" type="date" />
          <TextField label="Expiration Date" name="expiration_date" type="date" />
          <div className="lg:col-span-3">
            <FileField label="Credential File" name="file" accept=".pdf,.jpg,.jpeg,.png" />
          </div>
          <div className="flex items-end">
            <SubmitButton className="rounded-full" pendingText="Submitting...">Submit Credential</SubmitButton>
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
                <div key={credential.id} className="grid gap-3 rounded-lg border border-border bg-background/50 p-4 sm:grid-cols-[1fr_auto_auto]">
                  <div>
                    <p className="text-sm font-semibold">{credential.credential_type}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {credential.identifier ?? "No identifier"} | Expires {formatDate(credential.expiration_date)}
                      {days !== null ? ` | ${days < 0 ? "Expired" : `${days} days remaining`}` : ""}
                    </p>
                  </div>
                  <StatusBadge label={CREDENTIAL_STATUS_LABEL[credential.status] ?? credential.status} tone={toneFor(CREDENTIAL_STATUS_TONE, credential.status)} />
                  {credential.document_id ? (
                    <Link href={`/api/portal/documents/${credential.document_id}/download`} className="text-sm text-accent hover:underline">Download</Link>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>
    </PortalShell>
  );
}
