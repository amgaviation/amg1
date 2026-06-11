import { createServiceClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type PortalSession } from "@/lib/portal-session";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type Props = { session: PortalSession };

export async function AuditLogPanel({ session: _session }: Props) {
  const supabase = await createServiceClient();

  const { data: events } = await supabase
    .from("audit_events")
    .select("id, actor_email, actor_role, action, detail, entity_type, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-5xl mx-auto px-6 py-12 space-y-8">
        <div className="flex items-center gap-4">
          <Link
            href="/portal/admin"
            className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Admin Portal
          </Link>
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Audit Log</h1>
          <p className="text-muted-foreground text-sm">
            Immutable event history — last 100 events.
          </p>
        </div>

        {(events ?? []).length === 0 ? (
          <p className="text-muted-foreground text-sm py-8 text-center border border-border rounded-lg">
            No audit events recorded yet.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Detail</TableHead>
                <TableHead>Entity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(events ?? []).map((evt) => (
                <TableRow key={evt.id}>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Intl.DateTimeFormat("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                      second: "2-digit",
                    }).format(new Date(evt.created_at))}
                  </TableCell>
                  <TableCell className="text-xs font-mono">{evt.actor_email ?? "—"}</TableCell>
                  <TableCell>
                    {evt.actor_role && (
                      <Badge variant="outline" className="text-xs capitalize">
                        {evt.actor_role}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm font-medium">{evt.action}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                    {evt.detail ?? "—"}
                  </TableCell>
                  <TableCell>
                    {evt.entity_type && (
                      <Badge variant="outline" className="text-xs">
                        {evt.entity_type}
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
