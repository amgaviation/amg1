import { requireRole } from "@/lib/portal/session";
import { permissionsForRole } from "@/lib/portal/permissions";
import { PageHeader, QuickLink, SectionCard, StatCard } from "@/components/portal/ui/primitives";
import { createServiceClient } from "@/lib/supabase/server";

export const metadata = { title: "Network - AMG Operations" };

/**
 * Network workspace landing: the people and aircraft AMG coordinates with —
 * clients, aircraft, crew, partners — plus intake from crew network
 * applications. Directory depth lives in the section pages; this surface is
 * for counts, readiness, and fast entry.
 */
export default async function AdminNetworkPage() {
  const user = await requireRole("admin");
  const perms = await permissionsForRole(user.role);
  const db = await createServiceClient();

  const count = async (build: () => PromiseLike<{ count: number | null }>) => {
    try {
      const { count: value } = await build();
      return value ?? 0;
    } catch {
      return 0;
    }
  };

  const [clients, aircraft, crew, partners, openApplications, credentialAlerts] =
    await Promise.all([
      perms.clients.view
        ? count(() => db.from("profiles").select("id", { count: "exact", head: true }).eq("role", "client").eq("status", "approved"))
        : 0,
      perms.aircraft.view
        ? count(() => db.from("aircraft").select("id", { count: "exact", head: true }).neq("status", "archived"))
        : 0,
      perms.crew.view
        ? count(() => db.from("profiles").select("id", { count: "exact", head: true }).eq("role", "crew").eq("status", "approved"))
        : 0,
      perms.partners.view
        ? count(() => db.from("profiles").select("id", { count: "exact", head: true }).eq("role", "partner").eq("status", "approved"))
        : 0,
      perms.network_applications.view
        ? count(() => (db as any).from("network_applications").select("id", { count: "exact", head: true }).in("status", ["new", "in_review"]))
        : 0,
      perms.crew.view
        ? count(() => db.from("crew_credentials").select("id", { count: "exact", head: true }).in("status", ["expiring", "expired"]))
        : 0,
    ]);

  const tiles = [
    perms.clients.view && { label: "Clients", value: clients, href: "/portal/admin/clients", icon: "building" },
    perms.aircraft.view && { label: "Aircraft", value: aircraft, href: "/portal/admin/aircraft", icon: "planeTakeoff" },
    perms.crew.view && { label: "Crew", value: crew, href: "/portal/admin/crew", icon: "users" },
    perms.partners.view && { label: "Partners", value: partners, href: "/portal/admin/partners", icon: "handshake" },
  ].filter(Boolean) as { label: string; value: number; href: string; icon: string }[];

  return (
    <>
      <PageHeader
        eyebrow="Network"
        title="Network"
        description="The owners, aircraft, crew, and partners AMG coordinates with — and the readiness work that keeps them assignable."
      />

      {tiles.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {tiles.map((tile) => (
            <StatCard key={tile.label} {...tile} />
          ))}
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard
          title="Needs Attention"
          icon="alert"
          description="Readiness and intake work inside the network."
          bodyClassName="grid gap-3"
        >
          {perms.network_applications.view ? (
            <QuickLink
              href="/portal/admin/network-applications"
              icon="userCheck"
              label="Crew network applications"
              description={openApplications > 0 ? `${openApplications} open application${openApplications === 1 ? "" : "s"}` : "No open applications"}
            />
          ) : null}
          {perms.crew.view ? (
            <QuickLink
              href="/portal/admin/crew"
              icon="badgeCheck"
              label="Credential alerts"
              description={credentialAlerts > 0 ? `${credentialAlerts} expiring or expired credential${credentialAlerts === 1 ? "" : "s"}` : "All tracked credentials current"}
            />
          ) : null}
        </SectionCard>

        <SectionCard title="Directory" icon="users" bodyClassName="grid gap-3">
          {perms.clients.view ? (
            <QuickLink href="/portal/admin/clients" icon="building" label="Clients" description="Owner accounts and contacts" />
          ) : null}
          {perms.aircraft.view ? (
            <QuickLink href="/portal/admin/aircraft" icon="planeTakeoff" label="Aircraft" description="Airframes, bases, maintenance status" />
          ) : null}
          {perms.crew.view ? (
            <QuickLink href="/portal/admin/crew" icon="users" label="Crew" description="Roster, availability, credentials" />
          ) : null}
          {perms.partners.view ? (
            <QuickLink href="/portal/admin/partners" icon="handshake" label="Partners" description="Brokers, FBOs, vendors, service providers" />
          ) : null}
          {perms.users.view ? (
            <QuickLink href="/portal/admin/users" icon="user" label="All portal users" description="Accounts across every role (Administration)" />
          ) : null}
        </SectionCard>
      </div>

      {tiles.length === 0 ? (
        <SectionCard title="Network" icon="users">
          <p className="text-sm text-[var(--deck-text-3)]">
            Your role does not currently have access to network directories.
          </p>
        </SectionCard>
      ) : null}

      <p className="text-xs leading-5 text-[var(--deck-text-3)]">
        Directory records support owner-controlled operations. Aircraft owners retain operational
        control of their aircraft; the pilot in command retains go/no-go authority.
      </p>
    </>
  );
}
