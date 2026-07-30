import { redirect } from "next/navigation";
import { requireRole } from "@/lib/portal/session";
import { canAccessPilotHealth } from "@/lib/pilot-health/access";
import { createServiceClient } from "@/lib/supabase/server";
import { PilotHealthControls } from "@/components/portal/pilot-health-controls";
import {
  EmptyState,
  Notice,
  PageHeader,
  SectionCard,
  StatCard,
} from "@/components/portal/ui/primitives";

export const metadata = { title: "Pilot Health - Admin Portal" };

/**
 * Private Pilot Health workspace — visible to exactly one approved owner
 * account. The page re-runs the owner predicate server-side before any
 * service-role read; hidden navigation is never the boundary. Wellness scores
 * here are personal self-awareness signals only, never a medical assessment
 * or a fitness-for-duty input.
 */

type DailyRow = {
  day: string;
  readiness_score: number | null;
  sleep_score: number | null;
  activity_score: number | null;
  resting_heart_rate: number | null;
  average_hrv: number | null;
  hrv_balance: number | null;
  total_sleep_seconds: number | null;
  steps: number | null;
};

const FLASH: Record<string, { tone: "success" | "danger" | "warn" | "info"; text: string }> = {
  connected: { tone: "success", text: "Oura connected. Run a sync to import your recent metrics." },
  denied: { tone: "warn", text: "Oura access was declined. Nothing was connected." },
  provider_error: { tone: "danger", text: "Oura reported an authorization error. Try connecting again." },
  state_mismatch: { tone: "danger", text: "The sign-in attempt could not be verified. Try connecting again." },
  missing_code: { tone: "danger", text: "Oura returned without an authorization code. Try again." },
  exchange_failed: { tone: "danger", text: "Connecting to Oura failed. Try again in a moment." },
  save_failed: { tone: "danger", text: "The connection could not be saved. Try again." },
  not_configured: { tone: "warn", text: "The Oura integration is not configured in this environment." },
};

function formatSleep(seconds: number | null): string {
  if (seconds === null) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

function formatDay(day: string): string {
  const date = new Date(`${day}T00:00:00Z`);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function scoreValue(score: number | null): string | number {
  return score ?? "—";
}

export default async function PilotHealthPage({
  searchParams,
}: {
  searchParams: Promise<{ oura?: string }>;
}) {
  const user = await requireRole("admin");
  if (!canAccessPilotHealth(user)) redirect("/access-denied");

  const params = await searchParams;
  const flash = params.oura ? FLASH[params.oura] : undefined;

  // Service-role reads only after the explicit owner check above.
  const db = await createServiceClient();
  const [connectionResult, dailyResult] = await Promise.all([
    db
      .from("pilot_health_connections")
      .select("connected_at, last_synced_at, last_sync_status, scopes")
      .eq("profile_id", user.id)
      .maybeSingle(),
    db
      .from("pilot_health_daily")
      .select(
        "day, readiness_score, sleep_score, activity_score, resting_heart_rate, average_hrv, hrv_balance, total_sleep_seconds, steps"
      )
      .eq("profile_id", user.id)
      .order("day", { ascending: false })
      .limit(14),
  ]);

  const readFailed = Boolean(connectionResult.error || dailyResult.error);
  const connection = connectionResult.data ?? null;
  const days: DailyRow[] = dailyResult.data ?? [];
  const latest = days[0] ?? null;

  return (
    <>
      <PageHeader
        eyebrow="Private Workspace"
        title="Pilot Health"
        description="Your personal Oura wellness signals — readiness, sleep, and activity. A self-awareness tool only; never a medical assessment or a fitness-for-duty input."
        actions={
          <PilotHealthControls
            connected={Boolean(connection)}
            lastSyncedAt={connection?.last_synced_at ?? null}
          />
        }
      />

      {flash ? <Notice tone={flash.tone}>{flash.text}</Notice> : null}
      {readFailed ? (
        <Notice tone="danger">Health data could not be loaded. Refresh to try again.</Notice>
      ) : null}

      {connection ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard
              label="Readiness"
              value={scoreValue(latest?.readiness_score ?? null)}
              detail={latest ? formatDay(latest.day) : undefined}
              tone="accent"
              icon="activity"
            />
            <StatCard
              label="Sleep score"
              value={scoreValue(latest?.sleep_score ?? null)}
              detail={latest ? formatDay(latest.day) : undefined}
              icon="clock"
            />
            <StatCard
              label="Activity"
              value={scoreValue(latest?.activity_score ?? null)}
              detail={latest ? formatDay(latest.day) : undefined}
              icon="trendingUp"
            />
            <StatCard
              label="Resting HR"
              value={latest?.resting_heart_rate != null ? `${latest.resting_heart_rate}` : "—"}
              detail="bpm, lowest in sleep"
              icon="heart"
            />
            <StatCard
              label="Sleep"
              value={formatSleep(latest?.total_sleep_seconds ?? null)}
              detail={latest ? formatDay(latest.day) : undefined}
              icon="moon"
            />
          </div>

          <SectionCard
            title="Last 14 days"
            description="Daily summaries imported from your Oura account."
            icon="calendar"
          >
            {days.length === 0 ? (
              <EmptyState
                icon="activity"
                title="No metrics imported yet"
                description="Run a sync to pull your recent readiness, sleep, and activity summaries from Oura."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[42rem] text-sm">
                  <thead>
                    <tr className="border-b border-[var(--deck-line-strong)] text-left">
                      <th className="py-2 pr-4 font-medium text-[var(--deck-text-3)]">Day</th>
                      <th className="py-2 pr-4 font-medium text-[var(--deck-text-3)]">Readiness</th>
                      <th className="py-2 pr-4 font-medium text-[var(--deck-text-3)]">Sleep score</th>
                      <th className="py-2 pr-4 font-medium text-[var(--deck-text-3)]">Activity</th>
                      <th className="py-2 pr-4 font-medium text-[var(--deck-text-3)]">Resting HR</th>
                      <th className="py-2 pr-4 font-medium text-[var(--deck-text-3)]">HRV bal.</th>
                      <th className="py-2 pr-4 font-medium text-[var(--deck-text-3)]">Sleep</th>
                      <th className="py-2 font-medium text-[var(--deck-text-3)]">Steps</th>
                    </tr>
                  </thead>
                  <tbody>
                    {days.map((row) => (
                      <tr key={row.day} className="border-b border-[var(--deck-line)] last:border-0">
                        <td className="py-2.5 pr-4 font-medium text-[var(--deck-text)]">
                          {formatDay(row.day)}
                        </td>
                        <td className="deck-num py-2.5 pr-4">{scoreValue(row.readiness_score)}</td>
                        <td className="deck-num py-2.5 pr-4">{scoreValue(row.sleep_score)}</td>
                        <td className="deck-num py-2.5 pr-4">{scoreValue(row.activity_score)}</td>
                        <td className="deck-num py-2.5 pr-4">
                          {row.resting_heart_rate != null ? row.resting_heart_rate : "—"}
                        </td>
                        <td className="deck-num py-2.5 pr-4">{scoreValue(row.hrv_balance)}</td>
                        <td className="deck-num py-2.5 pr-4">{formatSleep(row.total_sleep_seconds)}</td>
                        <td className="deck-num py-2.5">{row.steps ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        </>
      ) : (
        <SectionCard title="Connect your Oura account" icon="activity">
          <EmptyState
            icon="activity"
            title="Oura is not connected"
            description="Connect your personal Oura account to import the last 14 days of readiness, sleep, and activity summaries. Data stays private to this account."
          />
        </SectionCard>
      )}

      <p className="deck-micro text-[var(--deck-text-3)]">
        Personal wellness data, visible only to this account. Not medical advice, not an
        aeromedical assessment, and never an input to flight, staffing, or duty decisions.
      </p>
    </>
  );
}
