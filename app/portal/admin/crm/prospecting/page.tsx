import Link from "next/link";
import { requireRolePermission } from "@/lib/portal/permissions";
import { Notice, PageHeader, SectionCard } from "@/components/portal/ui/primitives";
import { TextField } from "@/components/portal/ui/fields";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { Button } from "@/components/ui/button";
import { runProspectingPass } from "@/app/portal/actions/outreach";
import { LEAD_BUSINESS_TYPES } from "@/lib/portal/lead-email-templates";
import { prospectingConfigured } from "@/lib/portal/prospecting";
import { getOutreachSettings } from "@/lib/portal/outreach-settings";
import { SITE } from "@/lib/site-config";

export const metadata = { title: "Prospecting — AMG Operations" };
export const dynamic = "force-dynamic";

const PATH = "/portal/admin/crm/prospecting";

/** Default focus: the two profiles AMG sells to most directly. */
const DEFAULT_TYPES = new Set(["flight_dept", "mro"]);

export default async function ProspectingPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string; detail?: string }>;
}) {
  await requireRolePermission("admin", "crm");
  const params = await searchParams;
  const settings = await getOutreachSettings();
  const configured = prospectingConfigured();

  const [created, rejected] = (params.detail ?? "").split("|");

  return (
    <>
      {params.success === "prospected" ? (
        <Notice tone="success">
          Prospecting finished. {created ?? "0"} lead(s) created
          {rejected && rejected !== "0" ? `, ${rejected} candidate(s) rejected as unverifiable` : ""}.
        </Notice>
      ) : null}
      {params.error === "types" ? <Notice tone="danger">Pick at least one target profile.</Notice> : null}
      {params.error === "run" ? (
        <Notice tone="danger">Prospecting failed. {params.detail ?? ""}</Notice>
      ) : null}

      <PageHeader
        eyebrow="AMG Operations"
        title="Prospecting"
        description="Searches the web for real aviation businesses in your area, finds a published named contact, and adds them to the pipeline. Nothing is emailed here."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/portal/admin/crm">← Pipeline</Link>
          </Button>
        }
      />

      {!configured ? (
        <SectionCard title="Not configured" icon="alertTriangle">
          <p className="text-sm text-[var(--deck-text-3)]">
            Prospecting needs an <code>ANTHROPIC_API_KEY</code> environment variable in Vercel.
            Everything runs on AMG&rsquo;s own server against this database; the key is only used to
            search and read public pages.
          </p>
        </SectionCard>
      ) : null}

      <SectionCard title="Run a pass" icon="search">
        <form action={runProspectingPass} className="grid gap-5">
          <input type="hidden" name="back_to" value={PATH} />

          <div>
            <p className="text-sm font-medium">Target profile</p>
            <div className="mt-2 flex flex-wrap gap-4">
              {LEAD_BUSINESS_TYPES.filter((t) => t.value !== "general").map((type) => (
                <label key={type.value} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="business_types"
                    value={type.value}
                    defaultChecked={DEFAULT_TYPES.has(type.value)}
                    className="h-4 w-4"
                  />
                  {type.label}
                </label>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Where to look"
              name="region"
              defaultValue={`${SITE.serviceRegion} and the Southeast US`}
            />
            <TextField
              label="How many"
              name="count"
              type="number"
              defaultValue={String(Math.min(10, settings.prospectingBatchSize))}
              hint={`Capped at ${settings.prospectingBatchSize} by the outreach settings.`}
            />
          </div>

          <div>
            <SubmitButton pendingText="Searching, this takes a minute…" disabled={!configured}>
              Find prospects
            </SubmitButton>
          </div>
        </form>
      </SectionCard>

      <SectionCard title="What it will and will not do" icon="shield">
        <div className="grid gap-3 text-sm text-[var(--deck-text-2)]">
          <p>
            A model asked for &ldquo;the director of maintenance at X&rdquo; will produce a plausible
            name and a plausible address, and a plausible address is indistinguishable from a real
            one until it bounces. Bounces are what get a sending domain blocked, so every candidate
            is checked before it becomes a lead.
          </p>
          <div className="flex flex-wrap gap-2">
            <StatusBadge tone="success" label="Requires a source URL for every contact" />
            <StatusBadge tone="success" label="Email domain must match the company" />
            <StatusBadge tone="success" label="Rejects info@ and other shared inboxes" />
            <StatusBadge tone="success" label="Rejects personal free-mail addresses" />
            <StatusBadge tone="success" label="Skips anyone who unsubscribed" />
            <StatusBadge tone="success" label="Skips companies already in the pipeline" />
          </div>
          <p>
            Rejected candidates are counted, not created. New leads land at stage{" "}
            <strong>New</strong> and are <strong>not</strong> enrolled in outreach. Starting a
            sequence stays a separate, deliberate click on the lead, so a bad pass costs you a few
            rows to delete and cannot email anyone.
          </p>
        </div>
      </SectionCard>
    </>
  );
}
