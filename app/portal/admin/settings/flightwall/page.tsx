import Link from "next/link";
import { requireRole } from "@/lib/portal/session";
import { getFlightwallSettings, MAP_REGION_PRESETS } from "@/lib/flightwall/settings";
import { saveFlightwallSettings } from "@/app/portal/actions/flightwall-settings";
import { DetailRow, Notice, PageHeader, SectionCard } from "@/components/portal/ui/primitives";
import { TextField } from "@/components/portal/ui/fields";
import { FlightwallLayoutEditor } from "@/components/portal/admin/flightwall-layout-editor";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { Button } from "@/components/ui/button";

export const metadata = { title: "FlightWall Dashboard - Admin Settings" };

const MAP_STYLE_LABELS: Record<string, string> = {
  auto: "Auto — follow dashboard theme",
  dark: "Dark (FlightRadar night look)",
  light: "Light",
};

const selectClass =
  "rounded-lg border border-[var(--deck-line-strong)] bg-[var(--deck-panel)] px-2.5 py-2 text-sm text-[var(--deck-text)]";

export default async function AdminFlightwallSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const user = await requireRole("admin");
  const params = await searchParams;
  const settings = await getFlightwallSettings();

  // Editor starts from the saved free-form layout, or a faithful translation
  // of the legacy panel_order/show flags on first use.
  const initialLayout = settings.layout ?? {
    left: settings.showMap ? ["map", "nearby"] : [],
    right: [
      ...settings.panelOrder.filter(
        (p) =>
          (p === "requests" && settings.showRequests) ||
          (p === "missions" && settings.showMissions) ||
          (p === "revenue" && settings.showRevenue)
      ),
      ...(settings.showMetar ? ["metar"] : []),
    ],
  };

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
        description="Configure the wall-display ops dashboard (traffic map view, business panels, refresh rate). Changes apply on the next load — no redeploy."
        actions={
          <>
            <Button asChild size="sm" variant="outline">
              <Link href="/ops/flightwall/remote" target="_blank">
                Open Remote
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/ops/flightwall" target="_blank">
                Open Dashboard
              </Link>
            </Button>
          </>
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
        <SectionCard
          title="Map View"
          description="Real basemap (CARTO / OpenStreetMap) under live ADS-B traffic — pick a region or dial in a custom view"
          icon="radar"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1 text-xs text-[var(--deck-text-3)]">
              Map View
              <select name="map_region" defaultValue={settings.mapRegion} className={selectClass}>
                {Object.entries(MAP_REGION_PRESETS).map(([value, preset]) => (
                  <option key={value} value={value}>
                    {preset.label}
                  </option>
                ))}
                <option value="custom">Custom (use the fields below)</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs text-[var(--deck-text-3)]">
              Basemap Style
              <select name="map_style" defaultValue={settings.mapStyle} className={selectClass}>
                {Object.entries(MAP_STYLE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <TextField label="Custom Center Latitude" name="map_center_lat" type="number" step="0.0001" min="-90" max="90" defaultValue={String(settings.mapCenterLat)} />
            <TextField label="Custom Center Longitude" name="map_center_lon" type="number" step="0.0001" min="-180" max="180" defaultValue={String(settings.mapCenterLon)} />
            <TextField label="Custom Zoom (3 continent – 12 city)" name="map_zoom" type="number" min="3" max="12" defaultValue={String(settings.mapZoom)} />
          </div>
          <p className="mt-3 text-xs text-[var(--deck-text-3)]">
            Picking a named region overrides the custom fields; choose Custom to use them. The custom fields always show
            the currently active view, so switching to Custom starts from what&rsquo;s on the wall right now.
          </p>
        </SectionCard>

        <SectionCard title="Home Base & Watchlist" description="Distances and the nearby-traffic list are measured from home base; watchlisted tails glow gold" icon="mapPin">
          <div className="grid gap-4 md:grid-cols-2">
            <TextField label="Home Latitude" name="home_lat" type="number" step="0.0001" min="-90" max="90" defaultValue={String(settings.homeLat)} />
            <TextField label="Home Longitude" name="home_lon" type="number" step="0.0001" min="-180" max="180" defaultValue={String(settings.homeLon)} />
            <TextField
              label="Watchlist Tail Numbers"
              name="watchlist_tails"
              defaultValue={settings.watchlistTails.join(", ")}
              placeholder="N721AM, N88TF"
            />
          </div>
        </SectionCard>

        <SectionCard
          title="Layout"
          description="Visual layout of the wall display — drag anything anywhere, remove with ✕, add data widgets from the palette"
          icon="layers"
        >
          <FlightwallLayoutEditor initialLayout={initialLayout} />
        </SectionCard>

        <SectionCard
          title="Airports"
          description="Extra airports for the map layer and the remote's Go To Airport box — one per line: ICAO, IATA, Name, latitude, longitude"
          icon="planeLanding"
        >
          <textarea
            name="custom_airports"
            rows={5}
            defaultValue={settings.customAirports
              .map((ap) => `${ap[0]}, ${ap[1]}, ${ap[2]}, ${ap[3]}, ${ap[4]}`)
              .join("\n")}
            placeholder={"KPMP, PMP, Pompano Beach Airpark, 26.2471, -80.1111"}
            className="w-full rounded-lg border border-[var(--deck-line-strong)] bg-[var(--deck-panel)] px-3 py-2.5 font-mono text-xs text-[var(--deck-text)]"
          />
          <p className="mt-2 text-xs text-[var(--deck-text-3)]">
            ~90 major US airports are built in, and active rows from the portal&rsquo;s airports table are included
            automatically. Entries here are added on top (and can override a built-in by reusing its ICAO).
          </p>
        </SectionCard>

        <SectionCard title="Data Sources" description="Where each panel's numbers come from — read-only reference" icon="clipboard">
          <DetailRow label="Traffic Map">
            CARTO / OpenStreetMap basemap tiles with live public ADS-B positions from adsb.lol, proxied through
            /api/flightwall/flights (no PII).
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
            <TextField label="Flight Positions (seconds)" name="flights_poll_seconds" type="number" min="1" max="300" defaultValue={String(settings.flightsPollSeconds)} />
            <TextField label="Business Data (seconds)" name="ops_poll_seconds" type="number" min="10" max="300" defaultValue={String(settings.opsPollSeconds)} />
            <TextField label="METAR Station (ICAO)" name="metar_station" defaultValue={settings.metarStation} maxLength={4} />
          </div>
        </SectionCard>

        <SubmitButton pendingText="Saving...">Save Dashboard Settings</SubmitButton>
      </form>
    </>
  );
}
