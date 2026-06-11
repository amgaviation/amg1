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
import { addPassenger, deletePassenger, toggleFrequent } from "@/app/portal/passenger-actions";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type Props = { session: PortalSession };

export async function PassengerManager({ session: _session }: Props) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let passengers: {
    id: string;
    full_name: string;
    preferences: string | null;
    is_frequent: boolean;
  }[] = [];

  if (user) {
    const { data } = await supabase
      .from("passenger_profiles")
      .select("id, full_name, preferences, is_frequent")
      .eq("owner_id", user.id)
      .order("full_name");
    passengers = data ?? [];
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-8">
        <div className="flex items-center gap-4">
          <Link
            href="/portal/client"
            className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Portal
          </Link>
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Passenger Profiles</h1>
          <p className="text-muted-foreground text-sm">
            Manage passenger preferences for your support requests.
          </p>
        </div>

        {/* Add passenger form */}
        <form action={addPassenger} className="space-y-4 border border-border rounded-lg p-6">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
            Add Passenger
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground uppercase tracking-wider" htmlFor="full_name">
                Full Name
              </label>
              <input
                id="full_name"
                name="full_name"
                required
                className="w-full bg-secondary border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="First Last"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground uppercase tracking-wider" htmlFor="preferences">
                Preferences
              </label>
              <input
                id="preferences"
                name="preferences"
                className="w-full bg-secondary border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Dietary, seating, accessibility..."
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" id="is_frequent" name="is_frequent" value="true" className="rounded" />
            <label htmlFor="is_frequent" className="text-sm text-muted-foreground">
              Mark as frequent flyer
            </label>
          </div>
          <Button type="submit" size="sm">
            Add Passenger
          </Button>
        </form>

        {/* Passenger list */}
        {passengers.length === 0 ? (
          <p className="text-muted-foreground text-sm py-8 text-center">
            No passenger profiles yet. Add your first above.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Preferences</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {passengers.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.full_name}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {p.preferences ?? "—"}
                  </TableCell>
                  <TableCell>
                    {p.is_frequent ? (
                      <Badge variant="outline" className="text-xs border-primary/40 text-primary">
                        Frequent
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        Standard
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <form action={toggleFrequent}>
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="is_frequent" value={String(!p.is_frequent)} />
                        <Button type="submit" variant="ghost" size="sm" className="text-xs">
                          {p.is_frequent ? "Unmark" : "Mark frequent"}
                        </Button>
                      </form>
                      <form action={deletePassenger}>
                        <input type="hidden" name="id" value={p.id} />
                        <Button
                          type="submit"
                          variant="ghost"
                          size="sm"
                          className="text-xs text-destructive hover:text-destructive"
                        >
                          Remove
                        </Button>
                      </form>
                    </div>
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
