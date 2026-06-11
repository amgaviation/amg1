import { createServiceClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type PortalSession } from "@/lib/portal-session";
import { reviewAccessRequestDB, assignCrewToRequest } from "@/app/portal/admin-actions";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type Props = { session: PortalSession };

export async function AdminUsersPanel({ session: _session }: Props) {
  const supabase = await createServiceClient();

  const { data: accessRequests } = await supabase
    .from("access_requests")
    .select("id, ref, name, email, organization, role, reason, status, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  const { data: allRequests } = await supabase
    .from("support_requests")
    .select("id, ref, aircraft_tail, route, service, stage, requested_by_email, created_at")
    .order("created_at", { ascending: false })
    .limit(30);

  const { data: crewMembers } = await supabase
    .from("profiles")
    .select("id, email, full_name")
    .eq("role", "crew")
    .eq("is_active", true);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-5xl mx-auto px-6 py-12 space-y-12">
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
          <h1 className="text-2xl font-semibold tracking-tight">User Management</h1>
          <p className="text-muted-foreground text-sm">
            Review access requests, manage support requests, and assign crew.
          </p>
        </div>

        {/* Access requests */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
              Access Requests
            </h2>
            <Link href="/portal/admin/audit" className="text-xs text-primary hover:underline">
              View audit log
            </Link>
          </div>

          {(accessRequests ?? []).length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center border border-border rounded-lg">
              No access requests.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ref</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(accessRequests ?? []).map((req) => (
                  <TableRow key={req.id}>
                    <TableCell className="font-mono text-xs">{req.ref}</TableCell>
                    <TableCell className="font-medium">{req.name}</TableCell>
                    <TableCell className="text-sm font-mono">{req.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs capitalize">
                        {req.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs capitalize ${
                          req.status === "approved"
                            ? "border-green-600/40 text-green-500"
                            : req.status === "rejected"
                            ? "border-destructive/40 text-destructive"
                            : "border-yellow-500/40 text-yellow-500"
                        }`}
                      >
                        {req.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {req.status === "pending" && (
                        <div className="flex items-center justify-end gap-2">
                          <form action={reviewAccessRequestDB}>
                            <input type="hidden" name="id" value={req.id} />
                            <input type="hidden" name="decision" value="approved" />
                            <Button type="submit" size="sm" variant="outline" className="text-xs border-green-600/40 text-green-500 hover:bg-green-500/10">
                              Approve
                            </Button>
                          </form>
                          <form action={reviewAccessRequestDB}>
                            <input type="hidden" name="id" value={req.id} />
                            <input type="hidden" name="decision" value="rejected" />
                            <Button type="submit" size="sm" variant="ghost" className="text-xs text-destructive hover:text-destructive">
                              Reject
                            </Button>
                          </form>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </section>

        {/* Support requests lifecycle */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
            All Support Requests
          </h2>

          {(allRequests ?? []).length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center border border-border rounded-lg">
              No support requests.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ref</TableHead>
                  <TableHead>Aircraft</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(allRequests ?? []).map((req) => (
                  <TableRow key={req.id}>
                    <TableCell className="font-mono text-xs">{req.ref}</TableCell>
                    <TableCell className="font-mono text-sm">{req.aircraft_tail ?? "—"}</TableCell>
                    <TableCell className="text-sm">{req.route}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{req.service}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{req.stage}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2 flex-wrap">
                        {/* Advance stage */}
                        <form action={assignCrewToRequest} className="flex items-center gap-1">
                          <input type="hidden" name="request_id" value={req.id} />
                          <select
                            name="crew_id"
                            className="bg-secondary border border-border rounded px-2 py-1 text-xs focus:outline-none"
                          >
                            <option value="">Assign crew...</option>
                            {(crewMembers ?? []).map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.full_name ?? c.email}
                              </option>
                            ))}
                          </select>
                          <Button type="submit" size="sm" variant="outline" className="text-xs">
                            Assign
                          </Button>
                        </form>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </section>
      </div>
    </div>
  );
}
