import Link from "next/link";
import { requireRole } from "@/lib/portal/session";
import { getFlightwallSettings } from "@/lib/flightwall/settings";
import { saveFlightwallSettings } from "@/app/portal/actions/flightwall-settings";
import { DetailRow, Notice, PageHeader, SectionCard } from "@/components/portal/ui/primitives";
import { CheckboxField, TextField } from "@/components/portal/ui/fields";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { Button } from "@/components/ui/button";

export const metadata = { title: "FlightWall Dashboard - Admin Settings" };

const PANEL_LABELS: Record<string, string> = {
  map: "Traffic Map",
  requests: "Latest Requests",
  missions: "Mission Board",
  revenue: "Revenue",
  metar: "METAR Ticker",
};

export default async function AdminFlightwallSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const user = await requireRole("admin");
  const params = await searchParams;
  const settings = await getFlightwallSettings();

  const errorMessage =
    params.error === "invalid"
      ? "One or more values were out of range — nothing was saved."
      : params.error === "save"
        ? "Settings could not be saved. Try again."
        : null;

  return (
    <>
      <PageHeader
        eyebrow="Admin / Settings"
        title="FlightWall Dashboard"
        description="Configure the wall-display ops dashboard (traffic map, business panels, refresh rate). Changes apply on the next load — no redeploy."
        actions={
          <Button asChild size="sm" variant="outline">
            <Link href="/ops/flightwall" target="_blank">
              Open Dashboard
            </Link>
          </Button>
        }
      />

      {params.success === "1" ? <Notice tone="success">FlightWall dashboard settings saved.</Notice> : null}
      {errorMessage ? <Notice tone="danger">{errorMessage}</Notice> : null}

      <SectionCard
        title="Access"
        description="Who can open /ops/flightwall without logging in"
        icon="shield"
      >
        <DetailRow label="House network">
          Any device on an IP listed in FLIGHTWALL_TRUSTED_IPS (Vercel env var) opens the dashboard with no login.
        </DetailRow>
        <DetailRow label="Everywhere else">
          Falls back to this portal&rsquo;s normal admin login ({user.email} and any other admin/super_admin account).
        </DetailRow>
        <DetailRow label="Note">
          Home internet IPs usually change periodically. If the dashboard unexpectedly starts asking for login on the
          house network, the IP likely rotated — update FLIGHTWALL_TRUSTED_IPS in Vercel.
        </DetailRow>
      </SectionCard>

      <form action={saveFlightwallSettings}>
        <SectionCard title="Location & Traffic Map" description="Feeds live ADS-B tracking via adsb.lol" icon="mapPin">
          <div className="grid gap-4 md:grid-cols-2">
            <TextField label="Home Latitude" name="home_lat" type="number" step="0.0001" min="-90" max="90" defaultValue={String(settings.homeLat)} />
            <TextField label="Home Longitude" name="home_lon" type="number" step="0.0001" min="-180" max="180" defaultValue={String(settings.homeLon)} />
            <TextField label="Map Range (nm)" name="range_nm" type="number" min="5" max="250" defaultValue={String(settings.rangeNm)} />
            <TextField
              label="Watchlist Tail Numbers"
              name="watchlist_tails"
              defaultValue={settings.watchlistTails.join(", ")}
              placeholder="N721AM, N88TF"
            />
          </div>
        </SectionCard>

        <SectionCard title="Panels" description="Show/hide and order — the same order renders top to bottom on the dashboard" icon="layers">
          <div className="grid gap-3 sm:grid-cols-2">
            <CheckboxField label={`${PANEL_LABELS.map} — live radar/traffic map`} name="show_map" defaultChecked={settings.showMap} />
            <CheckboxField label={`${PANEL_LABELS.requests} — new AMG mission requests`} name="show_requests" defaultChecked={settings.showRequests} />
            <CheckboxField label={`${PANEL_LABELS.missions} — active mission board`} name="show_missions" defaultChecked={settings.showMissions} />
            <CheckboxField label={`${PANEL_LABELS.revenue} — today / month-to-date`} name="show_revenue" defaultChecked={settings.showRevenue} />
            <CheckboxField label={`${PANEL_LABELS.metar} — weather ticker`} name="show_metar" defaultChecked={settings.showMetar} />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-5">
            {settings.panelOrder.map((panel, index) => (
              <label key={index} className="flex flex-col gap-1 text-xs text-[var(--deck-text-3)]">
                Slot {index + 1}
                <select
                  name={`panel_slot_${index}`}
                  defaultValue={panel}
                  className="rounded-lg border border-[var(--deck-line-strong)] bg-[var(--deck-panel)] px-2.5 py-2 text-sm text-[var(--deck-text)]"
                >
                  {Object.entries(PANEL_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Data Sources" description="Where each panel's numbers come from — read-only reference" icon="clipboard">
          <DetailRow label="Traffic Map">
            Live public ADS-B positions from adsb.lol, proxied through /api/flightwall/flights (no PII).
          </DetailRow>
          <DetailRow label="Latest Requests">
            missions in intake status (submitted / under_review / awaiting_client_info), joined to
            public_support_requests / profiles for a first-name-last-initial label.
          </DetailRow>
          <DetailRow label="Mission Board">
            missions with status quoted, approved, crew_assigned, scheduled, or in_progress.
          </DetailRow>
          <DetailRow label="Revenue">
            payments (excluding failed/void/refunded) plus subscription_billing_invoices amount_paid — mirrored
            from Stripe via webhooks into Supabase, not a live Stripe API call.
          </DetailRow>
          <DetailRow label="METAR">
            Not yet wired to a live weather API — the dashboard shows a placeholder until this is connected.
          </DetailRow>
        </SectionCard>

        <SectionCard title="Refresh Rate" icon="gauge">
          <div className="grid gap-4 md:grid-cols-2">
            <TextField label="Flight Positions (seconds)" name="flights_poll_seconds" type="number" min="5" max="300" defaultValue={String(settings.flightsPollSeconds)} />
            <TextField label="Business Data (seconds)" name="ops_poll_seconds" type="number" min="10" max="300" defaultValue={String(settings.opsPollSeconds)} />
            <TextField label="METAR Station (ICAO)" name="metar_station" defaultValue={settings.metarStation} maxLength={4} />
          </div>
        </SectionCard>

        <SubmitButton pendingText="Saving...">Save Dashboard Settings</SubmitButton>
      </form>
    </>
  );
}
