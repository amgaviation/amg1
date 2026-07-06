import fs from "fs";
import path from "path";
import { requireRolePermission } from "@/lib/portal/permissions";
import { createServiceClient } from "@/lib/supabase/server";
import { DetailRow, PageHeader, SectionCard, StatCard } from "@/components/portal/ui/primitives";

export const metadata = { title: "System Health - Admin Portal" };

function configured(value: string | undefined) {
  return value ? "Configured" : "Missing";
}

function tone(value: string | undefined) {
  return value ? "success" : "warn";
}

async function getHealth() {
  const db = await createServiceClient();
  const [missions, users, failedNotifications, aircraft, expenses] = await Promise.all([
    db.from("missions").select("id", { count: "exact", head: true }),
    db.from("profiles").select("id", { count: "exact", head: true }),
    db.from("notification_deliveries").select("id", { count: "exact", head: true }).eq("status", "failed"),
    db.from("aircraft").select("tail_number"),
    db.from("expenses").select("id", { count: "exact", head: true }).in("status", ["approved", "partially_approved"]).eq("billable_to_client", true).is("invoice_id", null),
  ]);

  const tails = new Map<string, number>();
  for (const row of aircraft.data ?? []) {
    const tail = String(row.tail_number ?? "").toUpperCase().replace(/\s+/g, "");
    if (tail) tails.set(tail, (tails.get(tail) ?? 0) + 1);
  }

  const manifest = fs.readFileSync(path.join(process.cwd(), "lib/media/manifest.ts"), "utf8");
  const mediaPaths = [...manifest.matchAll(/(?:fallbackAsset|sourcePath|mobileSourcePath|posterSourcePath):\s*"([^"]+)"/g)].map((m) => m[1]).filter(Boolean);
  const missingMedia = mediaPaths.filter((assetPath) => assetPath.startsWith("/") && !fs.existsSync(path.join(process.cwd(), "public", assetPath)));

  return {
    databaseOk: !missions.error && !users.error,
    missionCount: missions.count ?? 0,
    userCount: users.count ?? 0,
    failedNotifications: failedNotifications.count ?? 0,
    duplicateTailCount: [...tails.values()].filter((count) => count > 1).length,
    unlinkedBillableExpenses: expenses.count ?? 0,
    missingMediaCount: missingMedia.length,
  };
}

export default async function AdminSystemHealthPage() {
  const user = await requireRolePermission("admin", "settings");
  const health = await getHealth();
  const commit = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local";
  const environment = process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown";

  return (
    <>
      <PageHeader
        eyebrow="AMG Operations"
        title="System Health"
        description="Production readiness checks for database, configuration, notifications, media, and deployment state."
      />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Database" value={health.databaseOk ? "OK" : "Check"} tone={health.databaseOk ? "accent" : "warn"} />
        <StatCard label="Missions" value={health.missionCount} />
        <StatCard label="Users" value={health.userCount} />
        <StatCard label="Failed notices" value={health.failedNotifications} tone={health.failedNotifications ? "warn" : "default"} />
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Provider Configuration" icon="shield">
          <dl>
            <DetailRow label="Supabase URL">{configured(process.env.NEXT_PUBLIC_SUPABASE_URL)}</DetailRow>
            <DetailRow label="Supabase anon key">{configured(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)}</DetailRow>
            <DetailRow label="Supabase service key">{configured(process.env.SUPABASE_SERVICE_ROLE_KEY)}</DetailRow>
            <DetailRow label="Resend">{configured(process.env.RESEND_API_KEY)}</DetailRow>
            <DetailRow label="Twilio">{configured(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN)}</DetailRow>
          </dl>
        </SectionCard>

        <SectionCard title="Operational Checks" icon="clipboard">
          <dl>
            <DetailRow label="Duplicate tail numbers">{health.duplicateTailCount}</DetailRow>
            <DetailRow label="Missing manifest media">{health.missingMediaCount}</DetailRow>
            <DetailRow label="Unlinked billable expenses">{health.unlinkedBillableExpenses}</DetailRow>
            <DetailRow label="Vercel environment">{environment}</DetailRow>
            <DetailRow label="Commit">{commit}</DetailRow>
          </dl>
        </SectionCard>
      </section>

      <SectionCard title="Readiness Notes" icon="fileText">
        <div className="grid gap-2 text-sm leading-6 text-muted-foreground">
          <p>Configuration checks show presence only. Secret values are never displayed.</p>
          <p>Run <code className="text-foreground">npm run media:audit</code>, <code className="text-foreground">npm run typecheck</code>, and <code className="text-foreground">npm run build</code> before promoting a deployment.</p>
        </div>
      </SectionCard>
    </>
  );
}
