import Link from "next/link";
import { ArrowRight, Building, ClipboardList, FileText, MessageSquare } from "lucide-react";
import { requireRole } from "@/lib/portal/session";
import { PortalShell } from "@/components/portal/shell/portal-shell";
import { EmptyState, PageHeader, SectionCard, StatCard } from "@/components/portal/ui/primitives";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { Button } from "@/components/ui/button";
import { countUnread, getPartnerProfile, listDocumentsForUser, listPartnerAssignments } from "@/lib/portal/queries";
import { PARTNER_STATUS_LABEL, PARTNER_STATUS_TONE, toneFor } from "@/lib/portal/constants";
import { formatDateTime, formatMoney } from "@/lib/portal/format";

export const metadata = { title: "Dashboard - Partner Portal" };

export default async function PartnerDashboardPage() {
  const user = await requireRole("partner");
  const [assignments, profile, docs, unread] = await Promise.all([
    listPartnerAssignments(user.id),
    getPartnerProfile(user.id),
    listDocumentsForUser({ userId: user.id, role: user.role }),
    countUnread(user.id),
  ]);
  const open = assignments.filter((a) => ["assigned", "accepted", "quoted", "in_progress"].includes(a.status));

  return (
    <PortalShell role="partner" user={user} unread={unread}>
      <PageHeader eyebrow="Service Partner" title="Partner Dashboard" description="Manage AMG service requests, quotes, supporting documents, and operations communication." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Open requests" value={open.length} href="/portal/partner/requests" tone={open.length ? "accent" : "default"} />
        <StatCard label="Documents" value={docs.length} href="/portal/partner/documents" />
        <StatCard label="Unread messages" value={unread} href="/portal/partner/messages" tone={unread ? "warn" : "default"} />
        <StatCard label="Profile" value={profile ? "Live" : "Setup"} href="/portal/partner/profile" detail={profile?.partner_type ?? "Complete service profile"} />
      </div>

      <SectionCard title="Quick Actions" icon="handshake" bodyClassName="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { href: "/portal/partner/requests", label: "Review Requests", icon: <ClipboardList className="h-4 w-4" /> },
          { href: "/portal/partner/profile", label: "Update Profile", icon: <Building className="h-4 w-4" /> },
          { href: "/portal/partner/documents?upload=1", label: "Upload Document", icon: <FileText className="h-4 w-4" /> },
          { href: "/portal/partner/messages?new=1", label: "Message AMG", icon: <MessageSquare className="h-4 w-4" /> },
        ].map((item) => (
          <Button key={item.href} asChild variant="outline" className="h-auto justify-start gap-3 rounded-lg py-3">
            <Link href={item.href}>{item.icon}<span className="text-sm font-medium">{item.label}</span><ArrowRight className="ml-auto h-3.5 w-3.5 text-muted-foreground" /></Link>
          </Button>
        ))}
      </SectionCard>

      <SectionCard title="Active Service Requests" icon="clipboard">
        {open.length === 0 ? (
          <EmptyState icon="clipboard" title="No active requests" description="New AMG service tasks will appear here when assigned." />
        ) : (
          <div className="space-y-3">
            {open.slice(0, 6).map((item) => (
              <Link key={item.id} href={`/portal/partner/requests/${item.id}`} className="grid gap-3 rounded-lg border border-border bg-background/50 p-4 hover:border-accent/60 sm:grid-cols-[1fr_auto]">
                <div>
                  <p className="font-mono text-xs text-accent">{item.ref}</p>
                  <p className="mt-1 text-sm font-semibold">{item.service_type} - {item.mission?.ref ?? "Mission TBD"}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.location ?? "Location TBD"} | {formatDateTime(item.created_at)}</p>
                  {item.quote_amount ? <p className="mt-1 text-xs text-muted-foreground">Quote {formatMoney(item.quote_amount)}</p> : null}
                </div>
                <StatusBadge label={PARTNER_STATUS_LABEL[item.status] ?? item.status} tone={toneFor(PARTNER_STATUS_TONE, item.status)} />
              </Link>
            ))}
          </div>
        )}
      </SectionCard>
    </PortalShell>
  );
}
