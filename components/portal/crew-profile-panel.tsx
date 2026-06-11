import { createClient } from "@/lib/supabase/server";
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
import { updateAvailability } from "@/app/portal/crew-actions";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

type Props = { session: PortalSession };

type CredentialStatus = "valid" | "expiring" | "expired" | "pending";

function statusBadge(status: CredentialStatus) {
  if (status === "valid") {
    return (
      <Badge variant="outline" className="text-xs border-green-600/40 text-green-500 gap-1">
        <CheckCircle2 className="w-3 h-3" />
        Valid
      </Badge>
    );
  }
  if (status === "expiring") {
    return (
      <Badge variant="outline" className="text-xs border-yellow-500/40 text-yellow-500 gap-1">
        <AlertTriangle className="w-3 h-3" />
        Expiring
      </Badge>
    );
  }
  if (status === "expired") {
    return (
      <Badge variant="outline" className="text-xs border-destructive/60 text-destructive gap-1">
        <XCircle className="w-3 h-3" />
        Expired
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-xs">
      Pending
    </Badge>
  );
}

export async function CrewProfilePanel({ session: _session }: Props) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let crewProfile: {
    certificate_number: string | null;
    ratings: string[] | null;
    availability_status: string;
    notes: string | null;
  } | null = null;

  let qualifications: {
    id: string;
    doc_type: string;
    doc_number: string | null;
    expires_at: string | null;
    status: CredentialStatus;
  }[] = [];

  let assignments: {
    id: string;
    role_on_request: string;
    status: string;
    support_requests: { ref: string; route: string; service: string; stage: string }[] | null;
  }[] = [];

  if (user) {
    const { data: cp } = await supabase
      .from("crew_profiles")
      .select("certificate_number, ratings, availability_status, notes")
      .eq("id", user.id)
      .single();
    crewProfile = cp;

    const { data: quals } = await supabase
      .from("crew_qualifications")
      .select("id, doc_type, doc_number, expires_at, status")
      .eq("crew_id", user.id)
      .order("expires_at", { ascending: true });
    qualifications = (quals ?? []) as typeof qualifications;

    const { data: asgn } = await supabase
      .from("assignments")
      .select("id, role_on_request, status, support_requests(ref, route, service, stage)")
      .eq("crew_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);
    assignments = (asgn ?? []) as unknown as typeof assignments;
  }

  const availabilityOptions = ["available", "limited", "unavailable"] as const;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-8">
        <div className="flex items-center gap-4">
          <Link
            href="/portal/crew"
            className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Portal
          </Link>
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Crew Profile</h1>
          <p className="text-muted-foreground text-sm">
            Your credentials, availability, and assignment history.
          </p>
        </div>

        {/* Profile summary */}
        <div className="border border-border rounded-lg p-6 space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
            Profile Summary
          </h2>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground text-xs uppercase tracking-wider">Certificate No.</dt>
              <dd className="mt-1 font-mono">{crewProfile?.certificate_number ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs uppercase tracking-wider">Ratings</dt>
              <dd className="mt-1">{crewProfile?.ratings?.join(", ") ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs uppercase tracking-wider">Notes</dt>
              <dd className="mt-1 col-span-2">{crewProfile?.notes ?? "—"}</dd>
            </div>
          </dl>
        </div>

        {/* Availability */}
        <form action={updateAvailability} className="border border-border rounded-lg p-6 space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
            Availability Status
          </h2>
          <div className="flex items-center gap-4 flex-wrap">
            {availabilityOptions.map((opt) => (
              <label key={opt} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="availability_status"
                  value={opt}
                  defaultChecked={crewProfile?.availability_status === opt}
                  className="accent-primary"
                />
                <span className="text-sm capitalize">{opt}</span>
              </label>
            ))}
          </div>
          <Button type="submit" size="sm">
            Update Availability
          </Button>
        </form>

        {/* Credentials */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
            Credentials
          </h2>
          {qualifications.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center border border-border rounded-lg">
              No credentials on file. Contact AMG Admin to add credentials.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document Type</TableHead>
                  <TableHead>Number</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {qualifications.map((q) => (
                  <TableRow key={q.id}>
                    <TableCell className="font-medium">{q.doc_type}</TableCell>
                    <TableCell className="font-mono text-sm">{q.doc_number ?? "—"}</TableCell>
                    <TableCell className="text-sm">
                      {q.expires_at
                        ? new Intl.DateTimeFormat("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }).format(new Date(q.expires_at))
                        : "—"}
                    </TableCell>
                    <TableCell>{statusBadge(q.status as CredentialStatus)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Assignments */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
            Recent Assignments
          </h2>
          {assignments.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center border border-border rounded-lg">
              No assignments yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-mono text-sm">
                      {(Array.isArray(a.support_requests) ? a.support_requests[0]?.ref : null) ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm">{(Array.isArray(a.support_requests) ? a.support_requests[0]?.route : null) ?? "—"}</TableCell>
                    <TableCell className="text-sm">{a.role_on_request}</TableCell>
                    <TableCell className="text-sm">{(Array.isArray(a.support_requests) ? a.support_requests[0]?.stage : null) ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs capitalize">
                        {a.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}
