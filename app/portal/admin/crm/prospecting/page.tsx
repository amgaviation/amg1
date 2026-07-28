import Link from "next/link";
import { requireRolePermission } from "@/lib/portal/permissions";
import { Notice, PageHeader, SectionCard } from "@/components/portal/ui/primitives";
import { TextField } from "@/components/portal/ui/fields";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { Button } from "@/components/ui/button";
import { importMroLeads, runFaaImport, runProspectingPass, startBulkLeadOutreach } from "@/app/portal/actions/outreach";
import { LEAD_BUSINESS_TYPES } from "@/lib/portal/lead-email-templates";
import { prospectingConfigured } from "@/lib/portal/prospecting";
import { getOutreachSettings } from "@/lib/portal/outreach-settings";
import { SITE } from "@/lib/site-config";

export const metadata = { title: "Prospecting — AMG Operations" };
export const dynamic = "force-dynamic";
// The FAA import streams a ~70 MB archive and scans ~193 MB of records.
export const maxDuration = 300;

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
      {params.success === "faa" ? (
        <Notice tone="success">
          FAA import finished. {(params.detail ?? "").split("|")[0] ?? "0"} owner(s) added
          {(params.detail ?? "").split("|")[2] && (params.detail ?? "").split("|")[2] !== "0"
            ? `, ${(params.detail ?? "").split("|")[2]} already in the pipeline`
            : ""}
          .
        </Notice>
      ) : null}
      {params.success === "mro" ? (
        <Notice tone="success">
          MRO directory import finished. {(params.detail ?? "").split("|")[0] ?? "0"} lead(s) added
          {(params.detail ?? "").split("|")[1] && (params.detail ?? "").split("|")[1] !== "0"
            ? `, ${(params.detail ?? "").split("|")[1]} already in the pipeline`
            : ""}
          {(params.detail ?? "").split("|")[2] && (params.detail ?? "").split("|")[2] !== "0"
            ? `, ${(params.detail ?? "").split("|")[2]} skipped as unsubscribed`
            : ""}
          .
        </Notice>
      ) : null}
      {params.success === "bulk-outreach" ? (
        <Notice tone="success">
          Bulk outreach enrolled {(params.detail ?? "").split("|")[0] ?? "0"} lead(s)
          {(params.detail ?? "").split("|")[2] && (params.detail ?? "").split("|")[2] !== "0"
            ? `, ${(params.detail ?? "").split("|")[2]} skipped (already running, unsubscribed, or taken over)`
            : ""}
          . Nothing sends until outreach is switched on, the templates are approved, and the send window opens.
        </Notice>
      ) : null}
      {params.error === "mro" ? (
        <Notice tone="danger">MRO directory import failed. {params.detail ?? ""}</Notice>
      ) : null}
      {params.error === "states" ? <Notice tone="danger">Enter at least one two-letter state code.</Notice> : null}
      {params.error === "classes" ? <Notice tone="danger">Pick at least one aircraft class.</Notice> : null}
      {params.error === "faa" ? (
        <Notice tone="danger">FAA import failed. {params.detail ?? ""}</Notice>
      ) : null}
      {params.error === "types" ? <Notice tone="danger">Pick at least one target profile.</Notice> : null}
      {params.error === "run" ? (
        <Notice tone="danger">Prospecting failed. {params.detail ?? ""}</Notice>
      ) : null}

      <PageHeader
        eyebrow="AMG Operations"
        title="Prospecting"
        description="Builds the pipeline from public records. The FAA Aircraft Registry is the primary source and needs no key. Nothing is emailed here, and nothing is enrolled in outreach."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/portal/admin/crm">← Pipeline</Link>
          </Button>
        }
      />

      {!configured ? (
        <SectionCard title="Web search is off" icon="alertTriangle">
          <p className="text-sm text-[var(--deck-text-3)]">
            The optional web-search source needs an <code>ANTHROPIC_API_KEY</code>. It is the only
            part of prospecting that does, and the FAA import below works without it. Worth knowing
            before adding one: real aviation business sites almost never publish email addresses,
            so web search is the only way to find a named contact with an address attached.
          </p>
        </SectionCard>
      ) : null}

      <SectionCard title="FAA Aircraft Registry" icon="database">
        <div className="grid gap-3 text-sm text-[var(--deck-text-2)]">
          <p>
            The registry is the actual record of every aircraft owner in the country: public domain,
            updated daily, no key and no cost. For Part 91 owners this beats searching the web,
            because it is not a guess at who owns an aircraft, it is the record of who owns it.
          </p>
          <p>
            Florida alone currently holds about <strong>2,660 turbine aircraft</strong> across{" "}
            <strong>2,054 owners</strong> once multiple tails are collapsed to one contact.
          </p>
          <p className="text-[var(--deck-text-3)]">
            The registry carries names and mailing addresses but <strong>no email</strong>, so these
            leads are a call-and-mail list. They are not enrolled in the email sequence, which would
            have nothing to send to.
          </p>
        </div>

        <form action={runFaaImport} className="mt-5 grid gap-5">
          <input type="hidden" name="back_to" value={PATH} />

          <div className="grid gap-4 sm:grid-cols-3">
            <TextField label="States (two-letter, comma separated)" name="states" defaultValue="FL" />
            <TextField
              label="How many owners"
              name="limit"
              type="number"
              defaultValue="100"
              hint="Highest fit score first. Max 500."
            />
            <div>
              <p className="text-sm font-medium">Aircraft class</p>
              <div className="mt-2 flex flex-wrap gap-3">
                {[
                  { value: "jet", label: "Jet" },
                  { value: "turboprop", label: "Turboprop" },
                  { value: "piston", label: "Piston" },
                ].map((c) => (
                  <label key={c.value} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="engine_classes"
                      value={c.value}
                      defaultChecked={c.value !== "piston"}
                      className="h-4 w-4"
                    />
                    {c.label}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <label className="flex items-center gap-3">
            <input type="checkbox" name="corporate_only" defaultChecked className="h-4 w-4" />
            <span className="text-sm">
              Corporate and LLC owners only
              <span className="block text-xs text-[var(--deck-text-3)]">
                Filters out individually-registered aircraft, which are mostly owner-flown.
              </span>
            </span>
          </label>

          <div>
            <SubmitButton pendingText="Downloading and scanning the registry…">
              Import owners
            </SubmitButton>
          </div>
        </form>
      </SectionCard>

      <SectionCard title="Southeast MRO directory (ready to email)" icon="database">
        <p className="text-sm leading-6 text-[var(--deck-text-3)]">
          204 FAA Part 145 repair stations across FL, GA, NC, SC, TN and AL — each with a
          contact email published on its own directory listing. Unlike the registry import
          above, these arrive emailable. Re-running tops the list up; it never duplicates a
          lead or re-adds anyone who has unsubscribed.
        </p>
        <form action={importMroLeads} className="mt-5">
          <input type="hidden" name="back_to" value={PATH} />
          <SubmitButton pendingText="Importing the directory…">Import MRO leads</SubmitButton>
        </form>
      </SectionCard>

      <SectionCard title="Start outreach in bulk" icon="send">
        <p className="text-sm leading-6 text-[var(--deck-text-3)]">
          Enrols every eligible lead of the chosen profiles into the three-touch sequence in
          one action, instead of one lead at a time. Leads without an email, opted out, on
          the suppression list, already mid-sequence, or in a stage a person has taken over
          are skipped automatically.
        </p>
        <Notice tone="warn">
          Enrolling is not sending. Each lead still passes the kill switch, template
          approval, daily cap and send window before anything leaves — so outreach must be
          switched on and the templates approved for these to actually go out.
        </Notice>
        <form action={startBulkLeadOutreach} className="mt-5 grid gap-5">
          <input type="hidden" name="back_to" value={PATH} />
          <fieldset className="grid gap-2">
            <legend className="deck-eyebrow mb-1 !text-[var(--deck-text-2)]">Target profiles</legend>
            <div className="flex flex-wrap gap-3">
              {LEAD_BUSINESS_TYPES.map((type) => (
                <label key={type.value} className="flex items-center gap-2 text-sm text-[var(--deck-text-2)]">
                  <input
                    type="checkbox"
                    name="business_types"
                    value={type.value}
                    defaultChecked={type.value === "mro" || type.value === "broker"}
                    className="h-4 w-4"
                  />
                  {type.label}
                </label>
              ))}
            </div>
          </fieldset>
          <TextField
            label="How many leads to enrol"
            name="limit"
            type="number"
            defaultValue="200"
            hint={`The sequence will still only send ${settings.dailySendCap} email(s) per rolling 24 hours; the rest wait their turn.`}
          />
          <div>
            <SubmitButton pendingText="Enrolling leads…">Start bulk outreach</SubmitButton>
          </div>
        </form>
      </SectionCard>

      <SectionCard title="How owners are ranked" icon="barChart">
        <div className="grid gap-3 text-sm text-[var(--deck-text-2)]">
          <p>
            A 16,000-row state list worked alphabetically is useless, so each owner gets a fit score
            out of 100: turbine over piston, corporate over individual, more seats, older airframe
            (maintenance downtime, and therefore ferry work, rises with age).
          </p>
          <p>
            Fleet size is deliberately <strong>not</strong> a straight bonus. Two to four aircraft is
            the sweet spot, enough movement to need help and not enough to justify staff pilots. Past
            ten the owner is a commercial operator or has its own crews. The first version of this
            ranked a 98-aircraft cargo operator top, which is the opposite of the target.
          </p>
        </div>
      </SectionCard>

      <SectionCard title="Web search (optional, needs a key)" icon="search">
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
