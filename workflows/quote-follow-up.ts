import { sleep } from "workflow";
import { createServiceClient } from "@/lib/supabase/server";
import { notifyAdmins, notifyUser } from "@/lib/portal/audit";

/**
 * Chase a sent quote until the client answers it.
 *
 * This is the case durable execution is actually for. A quote that goes out and
 * is never followed up is lost revenue, and the follow-up has to survive
 * deployments, restarts, and multi-day gaps — a setTimeout cannot, and a cron
 * sweeping every open quote re-reads the whole table to find the few that are
 * due. Here the wait costs nothing while it is pending and resumes exactly where
 * it left off.
 *
 * Started by sendQuote once the provider has genuinely accepted the email, so a
 * failed send never schedules a chase.
 */

/** Client has answered — or the quote is no longer live. Nothing left to chase. */
const CLOSED_STATUSES = [
  "approved",
  "rejected",
  "revision_requested",
  "converted",
  "void",
  "cancelled",
  "expired",
];

type QuoteSnapshot = {
  status: string;
  ref: string | null;
  clientId: string | null;
  expiresAt: string | null;
} | null;

async function readQuote(quoteId: string): Promise<QuoteSnapshot> {
  "use step";
  const db = await createServiceClient();
  const { data } = await db
    .from("quotes")
    .select("status, ref, client_id, expires_at")
    .eq("id", quoteId)
    .maybeSingle();
  if (!data) return null;
  return {
    status: data.status,
    ref: data.ref ?? null,
    clientId: data.client_id ?? null,
    expiresAt: data.expires_at ?? null,
  };
}

async function nudgeClient(quoteId: string, clientId: string) {
  "use step";
  await notifyUser({
    userId: clientId,
    title: "Your quote is still open",
    body: "Your AMG quote is waiting for a decision. Reply in the portal, or contact AMG Operations with any questions.",
    type: "quote_reminder",
    entityType: "quote",
    entityId: quoteId,
  });
}

async function tellOps(quoteId: string, title: string, body: string) {
  "use step";
  await notifyAdmins({
    title,
    body,
    type: "quote_follow_up",
    entityType: "quote",
    entityId: quoteId,
  });
}

export async function quoteFollowUp(quoteId: string) {
  "use workflow";

  // Two nudges, then hand it to a human. Past that point the quote needs a phone
  // call, not another notification.
  // `as const` matters: sleep() takes a literal duration type, and without it
  // the array widens `wait` to plain string and no overload matches.
  const stages = [
    { wait: "2d", nudge: true, opsTitle: "Quote unanswered after 2 days" },
    { wait: "3d", nudge: true, opsTitle: "Quote unanswered after 5 days" },
    { wait: "5d", nudge: false, opsTitle: "Quote still unanswered after 10 days — call the client" },
  ] as const;

  for (const stage of stages) {
    await sleep(stage.wait);

    const quote = await readQuote(quoteId);
    // Deleted, or answered while we were asleep. Either way, stop — re-checking
    // after every sleep is what keeps this from nagging a client who already
    // said yes.
    if (!quote) return { quoteId, outcome: "gone" };
    if (CLOSED_STATUSES.includes(quote.status)) {
      return { quoteId, outcome: "closed", status: quote.status };
    }

    const label = quote.ref ?? quoteId;

    if (stage.nudge && quote.clientId) {
      await nudgeClient(quoteId, quote.clientId);
    }
    await tellOps(quoteId, stage.opsTitle, `Quote ${label} is still ${quote.status}.`);

    if (quote.expiresAt && new Date(quote.expiresAt).getTime() < Date.now()) {
      await tellOps(
        quoteId,
        "Quote has lapsed",
        `Quote ${label} passed its expiry (${quote.expiresAt}) without an answer. Re-issue it or close it out.`,
      );
      return { quoteId, outcome: "lapsed" };
    }
  }

  return { quoteId, outcome: "exhausted" };
}
