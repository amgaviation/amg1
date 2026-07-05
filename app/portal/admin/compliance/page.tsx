import Link from "next/link";
import { requireRole } from "@/lib/portal/session";
import { DetailRow, Notice, PageHeader, SectionCard, StatCard } from "@/components/portal/ui/primitives";
import { createServiceClient } from "@/lib/supabase/server";
import { consentScriptRegistry } from "@/lib/compliance/consent";
import { legalDocuments } from "@/lib/compliance/legal-pages";
import { getUserFacingErrorMessage, logServerError } from "@/lib/errors/user-facing-errors";

export const metadata = { title: "Compliance - Admin Portal" };

async function tableCount(db: any, table: string) {
  const { count, error } = await db.from(table).select("id", { count: "exact", head: true });
  if (error) throw error;
  return count ?? 0;
}

async function complianceCounts() {
  try {
    const db = await createServiceClient();
    const [privacyRequests, consentEvents, marketingConsents, auditEvents, evidenceEvents, contentApprovals] = await Promise.all([
      tableCount(db as any, "privacy_requests"),
      tableCount(db as any, "consent_events"),
      tableCount(db as any, "marketing_consents"),
      tableCount(db as any, "compliance_audit_events"),
      tableCount(db as any, "compliance_evidence_events"),
      tableCount(db as any, "content_approvals"),
    ]);

    return { ok: true as const, privacyRequests, consentEvents, marketingConsents, auditEvents, evidenceEvents, contentApprovals };
  } catch (error) {
    const referenceId = logServerError("Compliance dashboard counts failed", error, { area: "admin_compliance" });
    return { ok: false as const, referenceId };
  }
}

export default async function AdminCompliancePage() {
  const user = await requireRole("admin");
  const counts = await complianceCounts();

  return (
    <>
      {!counts.ok ? (
        <Notice tone="warn">
          {getUserFacingErrorMessage({ area: "admin_portal", action: "load", correlationId: counts.referenceId })}
        </Notice>
      ) : null}
      <PageHeader
        eyebrow="AMG Operations"
        title="Compliance"
        description="Legal notices, privacy requests, consent architecture, script-gating, and administrative review checkpoints."
        actions={<Link href="/privacy-choices" className="rounded-full border border-[var(--deck-line)] px-4 py-2 text-xs font-semibold text-[var(--deck-text)] hover:border-[var(--deck-accent)]">Public Privacy Choices</Link>}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <StatCard label="Legal Notices" value={legalDocuments.length} detail="Public pages in the legal registry." />
        <StatCard label="Privacy Requests" value={counts.ok ? counts.privacyRequests : "-"} detail="Stored data rights requests." />
        <StatCard label="Consent Events" value={counts.ok ? counts.consentEvents : "-"} detail="Cookie preference events." />
        <StatCard label="Consent Records" value={counts.ok ? counts.marketingConsents : "-"} detail="Email and SMS consent history." />
        <StatCard label="Evidence Events" value={counts.ok ? counts.evidenceEvents : "-"} detail="Action-specific acknowledgment evidence." />
        <StatCard label="Content Reviews" value={counts.ok ? counts.contentApprovals : "-"} detail="Testimonial and proof approval records." />
      </div>

      <SectionCard title="Legal Notice Registry" icon="clipboard">
        <div className="grid gap-3 md:grid-cols-2">
          {legalDocuments.map((document) => (
            <Link
              key={document.slug}
              href={document.legacyPath ?? `/legal/${document.slug}`}
              className="rounded-lg border border-[var(--deck-line)] bg-[var(--deck-panel-2)] p-4 text-sm transition-colors hover:border-[var(--deck-accent)]"
            >
              <span className="font-semibold text-[var(--deck-text)]">{document.title}</span>
              <span className="mt-1 block text-xs leading-relaxed text-[var(--deck-text-3)]">{document.description}</span>
            </Link>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Script Gating" icon="shield">
        <dl>
          {consentScriptRegistry.map((script) => (
            <DetailRow key={script.id} label={script.category.replace(/_/g, " ")}>
              <span className="block font-medium">{script.id}</span>
              <span className="mt-1 block text-xs text-[var(--deck-text-3)]">{script.description}</span>
              <span className="mt-1 block text-xs text-[var(--deck-text-3)]">Environment key: {script.envKey}</span>
            </DetailRow>
          ))}
        </dl>
      </SectionCard>

      <SectionCard title="Operational Disclaimer" icon="plane">
        <p className="text-sm leading-relaxed text-[var(--deck-text-2)]">
          AMG support is reviewed before acceptance. No request is considered accepted until applicable operational
          scope, aircraft status, crew availability, owner/operator approval, and operating conditions have been reviewed.
        </p>
      </SectionCard>
    </>
  );
}
