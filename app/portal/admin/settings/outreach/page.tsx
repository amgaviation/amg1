import Link from "next/link";
import { requireRolePermission } from "@/lib/portal/permissions";
import { Notice, PageHeader, SectionCard } from "@/components/portal/ui/primitives";
import { TextField } from "@/components/portal/ui/fields";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { Button } from "@/components/ui/button";
import {
  approveOutreachTemplates,
  pauseOutreach,
  saveOutreachSettings,
} from "@/app/portal/actions/outreach";
import { getOutreachSettings, outreachSentLast24h } from "@/lib/portal/outreach-settings";
import { describeSendWindow } from "@/lib/portal/outreach-window";
import { formatDateTime } from "@/lib/portal/format";
import { createServiceClient } from "@/lib/supabase/server";

export const metadata = { title: "Lead Outreach — AMG Operations" };
export const dynamic = "force-dynamic";

const PATH = "/portal/admin/settings/outreach";

const DAYS = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 7, label: "Sun" },
];

async function suppressionCount() {
  const db = (await createServiceClient()) as any;
  const { count } = await db
    .from("lead_suppressions")
    .select("id", { count: "exact", head: true });
  return count ?? 0;
}

export default async function OutreachSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  await requireRolePermission("admin", "settings");
  const params = await searchParams;
  const [settings, sent24h, suppressed] = await Promise.all([
    getOutreachSettings(),
    outreachSentLast24h(),
    suppressionCount(),
  ]);

  const approved = Boolean(settings.templatesApprovedAt);
  const live = settings.enabled && approved;

  return (
    <>
      {params.success === "saved" ? <Notice tone="success">Outreach settings saved.</Notice> : null}
      {params.success === "approved" ? (
        <Notice tone="success">Templates approved. Automated outreach can now send.</Notice>
      ) : null}
      {params.success === "paused" ? <Notice tone="success">Automated outreach paused.</Notice> : null}
      {params.error === "window" ? (
        <Notice tone="danger">The send window must start before it ends.</Notice>
      ) : null}
      {params.error === "days" ? <Notice tone="danger">Pick at least one sending day.</Notice> : null}
      {params.error === "save" ? <Notice tone="danger">Settings could not be saved.</Notice> : null}

      <PageHeader
        eyebrow="AMG Operations"
        title="Lead Outreach"
        description="Automated three-touch outreach to new leads. Nothing sends unless automation is switched on AND the lead templates have been approved."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/portal/admin/settings">← Settings</Link>
          </Button>
        }
      />

      <SectionCard title="Status" icon="activity">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs font-medium text-[var(--deck-text-3)]">Sending</p>
            <div className="mt-1">
              <StatusBadge tone={live ? "success" : "neutral"} label={live ? "Live" : "Not sending"} />
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-[var(--deck-text-3)]">Sent (last 24h)</p>
            <p className="mt-1 text-lg">
              {sent24h} <span className="text-sm text-[var(--deck-text-3)]">/ {settings.dailySendCap}</span>
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-[var(--deck-text-3)]">Suppressed addresses</p>
            <p className="mt-1 text-lg">{suppressed}</p>
          </div>
        </div>

        <p className="mt-4 text-sm text-[var(--deck-text-3)]">
          Current window: {describeSendWindow({
            startHour: settings.sendWindowStartHour,
            endHour: settings.sendWindowEndHour,
            days: settings.sendDays,
            timeZone: settings.sendTimezone,
          })}
        </p>

        {live ? (
          <form action={pauseOutreach} className="mt-4">
            <input type="hidden" name="back_to" value={PATH} />
            <SubmitButton variant="destructive" size="sm">Pause all outreach</SubmitButton>
          </form>
        ) : null}
      </SectionCard>

      <SectionCard title="Template approval" icon="clipboard">
        <p className="text-sm text-[var(--deck-text-3)]">
          These emails go to people who have never heard from AMG, with no per-message review. Read the
          six lead templates before approving — approval is the record that a human vouched for this exact
          copy. Editing or resetting any lead template clears this automatically.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <StatusBadge
            tone={approved ? "success" : "warn"}
            label={approved ? "Approved" : "Not approved — nothing will send"}
          />
          {settings.templatesApprovedAt ? (
            <span className="text-sm text-[var(--deck-text-3)]">
              {formatDateTime(settings.templatesApprovedAt)}
            </span>
          ) : null}
          <Button asChild variant="outline" size="sm">
            <Link href="/portal/admin/settings/email-templates?family=lead">Review lead templates →</Link>
          </Button>
        </div>

        {!approved ? (
          <form action={approveOutreachTemplates} className="mt-4">
            <input type="hidden" name="back_to" value={PATH} />
            <SubmitButton size="sm">I&rsquo;ve read them — approve for automated sending</SubmitButton>
          </form>
        ) : null}
      </SectionCard>

      <SectionCard title="Pacing and schedule" icon="settings">
        <form action={saveOutreachSettings} className="grid gap-5">
          <input type="hidden" name="back_to" value={PATH} />

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              name="enabled"
              defaultChecked={settings.enabled}
              className="h-4 w-4"
            />
            <span className="text-sm">
              Automated outreach enabled
              <span className="block text-xs text-[var(--deck-text-3)]">
                Master switch. Off means no sequence sends, including ones already running.
              </span>
            </span>
          </label>

          <div className="grid gap-4 sm:grid-cols-3">
            <TextField
              label="Daily send cap"
              name="daily_send_cap"
              type="number"
              defaultValue={String(settings.dailySendCap)}
              hint="All outreach emails in a rolling 24h."
            />
            <TextField
              label="Follow-up 1 after (days)"
              name="followup_1_delay_days"
              type="number"
              defaultValue={String(settings.followup1DelayDays)}
            />
            <TextField
              label="Follow-up 2 after (days)"
              name="followup_2_delay_days"
              type="number"
              defaultValue={String(settings.followup2DelayDays)}
              hint="Counted from follow-up 1."
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <TextField
              label="Window opens (hour, 0–23)"
              name="send_window_start_hour"
              type="number"
              defaultValue={String(settings.sendWindowStartHour)}
            />
            <TextField
              label="Window closes (hour, 1–24)"
              name="send_window_end_hour"
              type="number"
              defaultValue={String(settings.sendWindowEndHour)}
            />
            <TextField
              label="Timezone"
              name="send_timezone"
              defaultValue={settings.sendTimezone}
              hint="IANA name, e.g. America/New_York."
            />
          </div>

          <div>
            <p className="text-sm font-medium">Sending days</p>
            <div className="mt-2 flex flex-wrap gap-3">
              {DAYS.map((day) => (
                <label key={day.value} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="send_days"
                    value={day.value}
                    defaultChecked={settings.sendDays.includes(day.value)}
                    className="h-4 w-4"
                  />
                  {day.label}
                </label>
              ))}
            </div>
          </div>

          <TextField
            label="Prospecting batch size"
            name="prospecting_batch_size"
            type="number"
            defaultValue={String(settings.prospectingBatchSize)}
            hint="Maximum new leads a single prospecting run may create."
          />

          <div>
            <SubmitButton>Save settings</SubmitButton>
          </div>
        </form>
      </SectionCard>
    </>
  );
}
