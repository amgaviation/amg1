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
import { updateVendorTask } from "@/app/portal/vendor-actions";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type Props = { session: PortalSession };

type VendorTaskStatus = "assigned" | "confirmed" | "in_progress" | "completed" | "cancelled";

function statusBadgeClass(status: VendorTaskStatus) {
  const map: Record<VendorTaskStatus, string> = {
    assigned: "border-yellow-500/40 text-yellow-500",
    confirmed: "border-blue-500/40 text-blue-400",
    in_progress: "border-primary/60 text-primary",
    completed: "border-green-600/40 text-green-500",
    cancelled: "border-border text-muted-foreground",
  };
  return map[status] ?? "";
}

export async function VendorTaskPanel({ session: _session }: Props) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let tasks: {
    id: string;
    ref: string;
    title: string;
    description: string | null;
    status: VendorTaskStatus;
    due_at: string | null;
    quote_amount: number | null;
    notes: string | null;
  }[] = [];

  if (user) {
    const { data } = await supabase
      .from("vendor_tasks")
      .select("id, ref, title, description, status, due_at, quote_amount, notes")
      .eq("partner_id", user.id)
      .order("created_at", { ascending: false });
    tasks = (data ?? []) as typeof tasks;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-5xl mx-auto px-6 py-12 space-y-8">
        <div className="flex items-center gap-4">
          <Link
            href="/portal/partner"
            className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Portal
          </Link>
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Vendor Tasks</h1>
          <p className="text-muted-foreground text-sm">
            Your assigned work items from AMG Operations.
          </p>
        </div>

        {tasks.length === 0 ? (
          <p className="text-muted-foreground text-sm py-8 text-center border border-border rounded-lg">
            No vendor tasks assigned yet.
          </p>
        ) : (
          <div className="space-y-6">
            {tasks.map((task) => (
              <div key={task.id} className="border border-border rounded-lg overflow-hidden">
                <div className="px-5 py-4 flex items-center justify-between border-b border-border bg-secondary/30">
                  <div className="space-y-0.5">
                    <p className="font-medium">{task.title}</p>
                    <p className="text-xs font-mono text-muted-foreground">{task.ref}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-xs capitalize ${statusBadgeClass(task.status)}`}
                  >
                    {task.status.replace("_", " ")}
                  </Badge>
                </div>

                <div className="px-5 py-4 space-y-4">
                  {task.description && (
                    <p className="text-sm text-muted-foreground">{task.description}</p>
                  )}

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Due</p>
                      <p className="mt-1">
                        {task.due_at
                          ? new Intl.DateTimeFormat("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }).format(new Date(task.due_at))
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Quote</p>
                      <p className="mt-1">
                        {task.quote_amount != null
                          ? `$${task.quote_amount.toFixed(2)}`
                          : "Not submitted"}
                      </p>
                    </div>
                  </div>

                  {/* Update form */}
                  <form action={updateVendorTask} className="flex flex-wrap items-end gap-3">
                    <input type="hidden" name="task_id" value={task.id} />

                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground uppercase tracking-wider">
                        Status
                      </label>
                      <select
                        name="status"
                        defaultValue={task.status}
                        className="bg-secondary border border-border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="assigned">Assigned</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground uppercase tracking-wider">
                        Quote ($)
                      </label>
                      <input
                        name="quote_amount"
                        type="number"
                        step="0.01"
                        min="0"
                        defaultValue={task.quote_amount ?? ""}
                        placeholder="0.00"
                        className="w-32 bg-secondary border border-border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    <div className="space-y-1 flex-1">
                      <label className="text-xs text-muted-foreground uppercase tracking-wider">
                        Notes
                      </label>
                      <input
                        name="notes"
                        defaultValue={task.notes ?? ""}
                        placeholder="Optional update note..."
                        className="w-full bg-secondary border border-border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    <Button type="submit" size="sm">
                      Update
                    </Button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
