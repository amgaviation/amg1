import "server-only";

import {
  resolveDateRange,
  type BreakdownPoint,
  type ChartPoint,
  type ClientFinancialRow,
  type ExpenseAnalyticsRow,
  type FinancialAnalyticsData,
  type FinancialAnalyticsFilters,
  type FinancialMetric,
  type InvoiceAnalyticsRow,
  type RevenueRow,
  type StripeHealthRow,
  type SubscriptionAnalyticsRow,
} from "@/lib/portal/financial-analytics";
import {
  DEMO_CLIENTS,
  DEMO_CREW,
  DEMO_INVOICES,
  DEMO_MISSIONS,
  DEMO_QUOTES,
  DEMO_SUBSCRIPTIONS,
} from "@/lib/demo/data";

/**
 * Demo-portal financial analytics: the same payload shape the real dashboard
 * consumes, computed from a deterministic simulated ledger instead of the
 * database. Daily revenue/expense events are a pure function of the calendar
 * day, so any range the range-picker requests produces stable, internally
 * consistent numbers (previous-period deltas included) without storing
 * anything.
 */

const DAY_MS = 86_400_000;

/** Deterministic hash → [0, 1). Same inputs, same output, forever. */
function rand(...seeds: number[]): number {
  let h = 2166136261 >>> 0;
  for (const seed of seeds) {
    h = Math.imul(h ^ Math.floor(seed), 16777619) >>> 0;
  }
  h ^= h >>> 13;
  h = Math.imul(h, 1274126177) >>> 0;
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

function count(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

function metric(input: {
  label: string;
  value: number;
  kind?: FinancialMetric["kind"];
  previous?: number | null;
  detail: string;
  source: string;
  tone?: FinancialMetric["tone"];
}): FinancialMetric {
  const kind = input.kind ?? "currency";
  const previous = input.previous ?? null;
  const delta =
    previous === null ? null : previous === 0 ? (input.value === 0 ? null : 100) : ((input.value - previous) / previous) * 100;
  return {
    label: input.label,
    value: input.value,
    formatted: kind === "currency" ? money(input.value) : kind === "percent" ? `${input.value.toFixed(1)}%` : count(input.value),
    kind,
    delta,
    deltaLabel: delta === null ? "No comparison data" : `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}% vs previous period`,
    detail: input.detail,
    source: input.source,
    tone: input.tone ?? (delta !== null && delta < 0 ? "warning" : "default"),
  };
}

type LedgerPayment = {
  id: string;
  at: string;
  amount: number;
  clientIndex: number;
  provider: string;
  method: string;
  source: "invoice" | "subscription";
  reference: string;
};

type LedgerExpense = {
  id: string;
  at: string;
  amount: number;
  category: string;
  merchant: string;
  crewIndex: number;
  missionRef: string;
  status: string;
};

const PROVIDER_CUTS: [number, string, string][] = [
  [0.38, "Stripe", "card"],
  [0.62, "Wire", "wire"],
  [0.8, "ACH", "ach"],
  [0.9, "Zelle", "zelle"],
  [1.01, "Check", "check"],
];

// Larger clients collect more often — mirrors the YTD figures in DEMO_CLIENTS.
const CLIENT_WEIGHTS = [0.2, 0.18, 0.16, 0.12, 0.11, 0.09, 0.08, 0.06];

const EXPENSE_CUTS: [number, string, string[]][] = [
  [0.3, "hotel", ["Harborview Suites", "Gateway Inn", "Summit Lodge", "Aerostay Crew Hotel"]],
  [0.55, "airline", ["United Airlines", "Delta Air Lines", "American Airlines", "Southwest Airlines"]],
  [0.67, "rental_car", ["Hertz", "Avis", "Enterprise"]],
  [0.77, "meals", ["Skyway Grill", "Runway Cafe", "Hangar Kitchen"]],
  [0.87, "fuel", ["Bozeman Jet Center", "Teterboro FBO", "Signature KHOU"]],
  [0.93, "rideshare", ["Uber", "Lyft"]],
  [0.97, "parking", ["Teterboro FBO", "Van Nuys Valet"]],
  [1.01, "other", ["Sporty's Pilot Shop", "AOG Freight Services"]],
];

function pickWeightedClient(r: number): number {
  let acc = 0;
  for (let i = 0; i < CLIENT_WEIGHTS.length; i++) {
    acc += CLIENT_WEIGHTS[i];
    if (r < acc) return i;
  }
  return 0;
}

function dayKeyOf(date: Date): number {
  return Math.floor(date.getTime() / DAY_MS);
}

/** Simulated growth: revenue ramps ~30% over the trailing 15 months. */
function growthFactor(dayKey: number, nowKey: number): number {
  const monthsAgo = Math.max(0, (nowKey - dayKey) / 30.4);
  return Math.max(0.7, 1 - monthsAgo * 0.02);
}

function paymentsForDay(dayKey: number, nowKey: number): LedgerPayment[] {
  const date = new Date(dayKey * DAY_MS);
  const dow = date.getUTCDay();
  const events: LedgerPayment[] = [];

  const weekend = dow === 0 || dow === 6;
  const roll = rand(dayKey, 1);
  let n = 0;
  if (weekend) {
    n = roll < 0.78 ? 0 : 1;
  } else {
    n = roll < 0.18 ? 0 : roll < 0.55 ? 1 : roll < 0.88 ? 2 : 3;
  }

  const g = growthFactor(dayKey, nowKey);
  for (let i = 0; i < n; i++) {
    const rAmount = rand(dayKey, 10 + i);
    const amount = Math.round((2200 + rAmount * rAmount * 34000) * g);
    const rProvider = rand(dayKey, 30 + i);
    const cut = PROVIDER_CUTS.find(([edge]) => rProvider < edge) ?? PROVIDER_CUTS[0];
    const clientIndex = pickWeightedClient(rand(dayKey, 50 + i));
    const hour = 9 + Math.floor(rand(dayKey, 70 + i) * 9);
    events.push({
      id: `demo-pay-${dayKey}-${i}`,
      at: new Date(dayKey * DAY_MS + hour * 3_600_000).toISOString(),
      amount,
      clientIndex,
      provider: cut[1],
      method: cut[2],
      source: "invoice",
      reference: `INV-${1860 + ((dayKey * 3 + i * 7) % 220)}`,
    });
  }

  // Membership billing: each subscription collects on its own day of month.
  const dom = date.getUTCDate();
  DEMO_SUBSCRIPTIONS.forEach((sub, index) => {
    if (sub.status === "past_due" || sub.status === "trialing") return;
    if (sub.cadence === "annual") {
      // One annual renewal, mid-March.
      if (date.getUTCMonth() !== 2 || dom !== 15) return;
      events.push({
        id: `demo-sub-${dayKey}-${index}`,
        at: new Date(dayKey * DAY_MS + 12 * 3_600_000).toISOString(),
        amount: sub.amount,
        clientIndex: Math.max(0, DEMO_CLIENTS.findIndex((c) => c.company === sub.client)),
        provider: "Stripe Subscriptions",
        method: "stripe",
        source: "subscription",
        reference: `SUB-${3100 + index}`,
      });
      return;
    }
    const payday = 2 + ((index * 5) % 23);
    if (dom !== payday) return;
    events.push({
      id: `demo-sub-${dayKey}-${index}`,
      at: new Date(dayKey * DAY_MS + 8 * 3_600_000).toISOString(),
      amount: sub.amount,
      clientIndex: Math.max(0, DEMO_CLIENTS.findIndex((c) => c.company === sub.client)),
      provider: "Stripe Subscriptions",
      method: "stripe",
      source: "subscription",
      reference: `SUB-${3100 + index}`,
    });
  });

  return events;
}

const EXPENSE_STATUSES = ["approved", "approved", "reimbursed", "added_to_invoice", "submitted"];

function expensesForDay(dayKey: number, nowKey: number): LedgerExpense[] {
  const roll = rand(dayKey, 2);
  const n = roll < 0.34 ? 0 : roll < 0.74 ? 1 : roll < 0.95 ? 2 : 3;
  const g = growthFactor(dayKey, nowKey);
  const events: LedgerExpense[] = [];
  for (let i = 0; i < n; i++) {
    const rCat = rand(dayKey, 110 + i);
    const cut = EXPENSE_CUTS.find(([edge]) => rCat < edge) ?? EXPENSE_CUTS[0];
    const rAmount = rand(dayKey, 130 + i);
    const amount = Math.round((120 + Math.pow(rAmount, 1.7) * 2400) * g * 100) / 100;
    const crewIndex = Math.floor(rand(dayKey, 150 + i) * DEMO_CREW.length);
    const merchant = cut[2][Math.floor(rand(dayKey, 170 + i) * cut[2].length)];
    const mission = DEMO_MISSIONS[Math.floor(rand(dayKey, 190 + i) * DEMO_MISSIONS.length)];
    events.push({
      id: `demo-exp-${dayKey}-${i}`,
      at: new Date(dayKey * DAY_MS + (8 + Math.floor(rand(dayKey, 210 + i) * 10)) * 3_600_000).toISOString(),
      amount,
      category: cut[1],
      merchant,
      crewIndex,
      missionRef: mission.ref,
      status: EXPENSE_STATUSES[Math.floor(rand(dayKey, 230 + i) * EXPENSE_STATUSES.length)],
    });
  }
  return events;
}

function collect<T>(fromIso: string, toIso: string, forDay: (dayKey: number, nowKey: number) => T[]): T[] {
  const nowKey = dayKeyOf(new Date());
  const fromKey = dayKeyOf(new Date(fromIso));
  const toKey = Math.min(dayKeyOf(new Date(toIso)), nowKey);
  const out: T[] = [];
  for (let key = fromKey; key <= toKey; key++) {
    out.push(...forDay(key, nowKey));
  }
  return out;
}

function timeBucketLabel(iso: string, rangeDays: number): string {
  const d = new Date(iso);
  return rangeDays > 62
    ? `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`
    : `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
}

function addToMap(map: Map<string, number>, label: string, amount: number) {
  map.set(label, (map.get(label) ?? 0) + amount);
}

function topBreakdown(map: Map<string, number>, limit = 8): BreakdownPoint[] {
  return [...map.entries()]
    .map(([label, value]) => ({ label, value: Math.round(value) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

function agingBucketFor(dueInDays: number, amountDue: number, status: string): string {
  if (amountDue <= 0 || status === "paid") return "Paid";
  if (dueInDays >= 0) return "Current";
  const overdue = -dueInDays;
  if (overdue <= 30) return "1-30 days";
  if (overdue <= 60) return "31-60 days";
  if (overdue <= 90) return "61-90 days";
  return "90+ days";
}

export async function getDemoFinancialAnalytics(
  filters: FinancialAnalyticsFilters = {}
): Promise<FinancialAnalyticsData> {
  const dateRange = resolveDateRange(filters);
  const now = new Date();
  const nowIso = now.toISOString();
  const rangeDays = Math.max(
    1,
    Math.ceil((new Date(dateRange.to).getTime() - new Date(dateRange.from).getTime()) / DAY_MS)
  );

  const payments = collect(dateRange.from, dateRange.to, paymentsForDay).filter(
    (event) => event.at >= dateRange.from && event.at <= dateRange.to
  );
  const previousPayments = collect(dateRange.previousFrom, dateRange.previousTo, paymentsForDay).filter(
    (event) => event.at >= dateRange.previousFrom && event.at <= dateRange.previousTo
  );
  const expenses = collect(dateRange.from, dateRange.to, expensesForDay).filter(
    (event) => event.at >= dateRange.from && event.at <= dateRange.to
  );
  const previousExpenses = collect(dateRange.previousFrom, dateRange.previousTo, expensesForDay).filter(
    (event) => event.at >= dateRange.previousFrom && event.at <= dateRange.previousTo
  );

  const moneyIn = payments.reduce((sum, event) => sum + event.amount, 0);
  const previousMoneyIn = previousPayments.reduce((sum, event) => sum + event.amount, 0);
  const moneyOut = Math.round(expenses.reduce((sum, event) => sum + event.amount, 0));
  const previousMoneyOut = Math.round(previousExpenses.reduce((sum, event) => sum + event.amount, 0));

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const yearStart = new Date(now.getFullYear(), 0, 1).toISOString();
  const monthlyIncome = collect(monthStart, nowIso, paymentsForDay).reduce((sum, e) => sum + e.amount, 0);
  const yearlyIncome = collect(yearStart, nowIso, paymentsForDay).reduce((sum, e) => sum + e.amount, 0);

  const pendingInvoices = DEMO_INVOICES.filter((invoice) => invoice.amountDue > 0);
  const pendingPayments = pendingInvoices.reduce((sum, invoice) => sum + invoice.amountDue, 0);
  const overdueInvoices = pendingInvoices.filter((invoice) => invoice.dueInDays < 0);
  const overdueAmount = overdueInvoices.reduce((sum, invoice) => sum + invoice.amountDue, 0);
  const openInvoiceValue = pendingInvoices.reduce((sum, invoice) => sum + invoice.total, 0);

  const activeSubscriptions = DEMO_SUBSCRIPTIONS.filter((sub) => ["active", "trialing"].includes(sub.status));
  const mrr = DEMO_SUBSCRIPTIONS.filter((sub) => sub.status === "active").reduce((sum, sub) => sum + sub.mrr, 0);
  const failedPayments = DEMO_SUBSCRIPTIONS.filter((sub) => sub.status === "past_due").length;

  const creditSubscriptions = DEMO_SUBSCRIPTIONS.filter((sub) => sub.creditBalance > 0);
  const creditLiability = creditSubscriptions.reduce((sum, sub) => sum + sub.creditBalance, 0);

  // Quote KPIs from the authored quote set (windowed loosely on the range so
  // short ranges still show a resolved sample instead of a dash).
  const windowDays = Math.max(rangeDays, 14);
  const quotesInWindow = DEMO_QUOTES.filter((quote) => (quote.sentDaysAgo ?? 0) <= windowDays);
  const wonQuotes = quotesInWindow.filter((quote) => ["approved", "converted"].includes(quote.status));
  const lostQuotes = quotesInWindow.filter((quote) => ["rejected", "expired"].includes(quote.status));
  const resolved = wonQuotes.length + lostQuotes.length;
  const quoteValue = quotesInWindow.reduce((sum, quote) => sum + quote.total, 0);
  const approvedQuoteValue = wonQuotes.reduce((sum, quote) => sum + quote.total, 0);

  const invoiceSales = Math.round(moneyIn * 1.12);
  const previousInvoiceSales = Math.round(previousMoneyIn * 1.12);
  const invoiceCount = Math.max(1, payments.filter((event) => event.source === "invoice").length);

  // ── Charts (insertion order = chronological; no lexicographic sorting) ──
  const revenueBuckets = new Map<string, number>();
  const moneyOutBuckets = new Map<string, number>();
  const subscriptionBuckets = new Map<string, number>();
  const providerBuckets = new Map<string, number>();
  const topClients = new Map<string, number>();

  for (const event of payments) {
    const label = timeBucketLabel(event.at, rangeDays);
    addToMap(revenueBuckets, label, event.amount);
    addToMap(providerBuckets, event.provider, event.amount);
    addToMap(topClients, DEMO_CLIENTS[event.clientIndex]?.company ?? "Member client", event.amount);
    if (event.source === "subscription") addToMap(subscriptionBuckets, label, event.amount);
  }
  for (const event of expenses) {
    addToMap(moneyOutBuckets, timeBucketLabel(event.at, rangeDays), event.amount);
  }

  const timelineLabels = [...new Set([...revenueBuckets.keys(), ...moneyOutBuckets.keys()])];
  const moneyInOut: ChartPoint[] = timelineLabels.map((label) => ({
    label,
    value: Math.round(revenueBuckets.get(label) ?? 0),
    secondary: Math.round(moneyOutBuckets.get(label) ?? 0),
  }));

  const invoiceStatus = new Map<string, number>();
  for (const invoice of DEMO_INVOICES) addToMap(invoiceStatus, invoice.status, invoice.total);

  const aging = new Map<string, number>([
    ["Current", 0],
    ["1-30 days", 0],
    ["31-60 days", 0],
    ["61-90 days", 0],
    ["90+ days", 0],
  ]);
  for (const invoice of pendingInvoices) {
    const bucket = agingBucketFor(invoice.dueInDays, invoice.amountDue, invoice.status);
    if (bucket !== "Paid") addToMap(aging, bucket, invoice.amountDue);
  }

  const expenseCategories = new Map<string, number>();
  for (const event of expenses) addToMap(expenseCategories, event.category, event.amount);

  const quotePipeline = new Map<string, number>();
  for (const quote of DEMO_QUOTES) addToMap(quotePipeline, quote.status, quote.total);

  // ── Rows ──
  const revenueRows: RevenueRow[] = [...payments]
    .sort((a, b) => (a.at < b.at ? 1 : -1))
    .slice(0, 60)
    .map((event) => ({
      id: event.id,
      date: event.at,
      source: event.source,
      provider: event.provider,
      paymentMethod: event.method,
      client: DEMO_CLIENTS[event.clientIndex]?.company ?? "Member client",
      reference: event.reference,
      amount: event.amount,
      status: "succeeded",
      paidAt: event.at,
      safePaymentId: `pi_demo_${event.id.slice(-8)}`,
      href: null,
    }));

  const invoiceRows: InvoiceAnalyticsRow[] = DEMO_INVOICES.map((invoice) => ({
    id: invoice.id,
    invoiceNumber: invoice.number,
    client: invoice.client,
    amount: invoice.total,
    amountDue: invoice.amountDue,
    status: invoice.status,
    paymentStatus: invoice.amountDue <= 0 ? "paid" : "open",
    dueDate: new Date(now.getTime() + invoice.dueInDays * DAY_MS).toISOString(),
    sentDate: new Date(now.getTime() - invoice.issuedDaysAgo * DAY_MS).toISOString(),
    paidDate: invoice.paidDaysAgo === null ? null : new Date(now.getTime() - invoice.paidDaysAgo * DAY_MS).toISOString(),
    daysOutstanding: invoice.paidDaysAgo === null ? invoice.issuedDaysAgo : invoice.issuedDaysAgo - invoice.paidDaysAgo,
    overdueBucket: agingBucketFor(invoice.dueInDays, invoice.amountDue, invoice.status),
    provider: invoice.status === "paid" ? "Stripe" : "Manual",
    syncStatus: "manual",
    href: "",
  }));

  const subscriptionRows: SubscriptionAnalyticsRow[] = DEMO_SUBSCRIPTIONS.map((sub) => ({
    id: sub.id,
    client: sub.client,
    plan: sub.plan,
    interval: sub.cadence,
    amount: sub.amount,
    normalizedMrr: sub.mrr,
    status: sub.status,
    currentPeriodEnd: new Date(now.getTime() + sub.periodEndDays * DAY_MS).toISOString(),
    paymentStatus: sub.status === "past_due" ? "past_due" : "paid",
    syncStatus: "synced",
    lastSynced: new Date(now.getTime() - 2 * 3_600_000).toISOString(),
    href: "",
  }));

  const expenseRows: ExpenseAnalyticsRow[] = [...expenses]
    .sort((a, b) => (a.at < b.at ? 1 : -1))
    .slice(0, 40)
    .map((event) => ({
      id: event.id,
      date: event.at,
      vendor: DEMO_CREW[event.crewIndex]?.name ?? "Contract crew",
      category: event.category,
      amount: event.amount,
      approvedAmount: event.status === "submitted" ? null : event.amount,
      reimbursable: true,
      billableToClient: event.category !== "meals",
      linkedClientOrMission: event.missionRef,
      notes: event.merchant,
      status: event.status,
    }));

  const clientRowMap = new Map<string, ClientFinancialRow>();
  for (const client of DEMO_CLIENTS) {
    clientRowMap.set(client.company, {
      id: client.id,
      client: client.company,
      revenue: 0,
      pending: 0,
      overdue: 0,
      invoices: 0,
      activeSubscriptions: DEMO_SUBSCRIPTIONS.filter(
        (sub) => sub.client === client.company && ["active", "trialing"].includes(sub.status)
      ).length,
      failedPayments: DEMO_SUBSCRIPTIONS.filter(
        (sub) => sub.client === client.company && sub.status === "past_due"
      ).length,
    });
  }
  for (const event of payments) {
    const row = clientRowMap.get(DEMO_CLIENTS[event.clientIndex]?.company ?? "");
    if (row) row.revenue += event.amount;
  }
  for (const invoice of DEMO_INVOICES) {
    const row = clientRowMap.get(invoice.client);
    if (!row) continue;
    row.invoices += 1;
    row.pending += invoice.amountDue;
    if (invoice.dueInDays < 0 && invoice.amountDue > 0) row.overdue += invoice.amountDue;
  }

  const stripeEventTypes = [
    "invoice.payment_succeeded",
    "customer.subscription.updated",
    "checkout.session.completed",
    "invoice.payment_succeeded",
    "invoice.payment_failed",
    "customer.subscription.updated",
    "invoice.payment_succeeded",
    "payment_intent.succeeded",
    "invoice.payment_succeeded",
    "customer.subscription.created",
  ];
  const stripeHealthRows: StripeHealthRow[] = stripeEventTypes.map((eventType, index) => {
    const receivedAt = new Date(now.getTime() - (3 + index * 11) * 3_600_000).toISOString();
    return {
      id: `demo-evt-${index}`,
      eventType,
      stripeEventId: `evt_demo_${String(9200 - index * 7).padStart(6, "0")}`,
      status: "processed",
      receivedAt,
      processedAt: receivedAt,
      subscriptionId: eventType.includes("subscription") ? `sub_demo_${100 + index}` : null,
      invoiceId: eventType.includes("invoice") ? `in_demo_${400 + index}` : null,
      error: null,
    };
  });

  return {
    reportedAt: nowIso,
    dateRange,
    metrics: {
      moneyIn: metric({ label: "Money In", value: moneyIn, previous: previousMoneyIn, detail: "Collected invoice payments plus paid membership subscription invoices.", source: "Simulated demo ledger", tone: "positive" }),
      moneyOut: metric({ label: "Money Out", value: moneyOut, previous: previousMoneyOut, detail: "Crew travel, lodging, fuel, and pass-through expenses in the period.", source: "Simulated demo ledger" }),
      netCash: metric({ label: "Net Cash Movement", value: moneyIn - moneyOut, previous: previousMoneyIn - previousMoneyOut, detail: "Money In minus Money Out for the selected period.", source: "Simulated demo ledger", tone: moneyIn - moneyOut < 0 ? "danger" : "positive" }),
      monthlyIncome: metric({ label: "Monthly Income", value: monthlyIncome, previous: null, detail: "Collected revenue month to date.", source: "Simulated demo ledger" }),
      yearlyIncome: metric({ label: "Yearly Income", value: yearlyIncome, previous: null, detail: "Collected revenue year to date.", source: "Simulated demo ledger" }),
      pendingPayments: metric({ label: "Pending Payments", value: pendingPayments, previous: null, detail: "Open invoice balances awaiting collection.", source: "Simulated demo ledger", tone: pendingPayments ? "warning" : "positive" }),
      overdueAmount: metric({ label: "Overdue Amount", value: overdueAmount, previous: null, detail: `${overdueInvoices.length} invoices are past due.`, source: "Simulated demo ledger", tone: overdueAmount ? "danger" : "positive" }),
      activeSubscriptions: metric({ label: "Active Subscriptions", value: activeSubscriptions.length, kind: "number", previous: null, detail: `${money(mrr)} MRR / ${money(mrr * 12)} ARR.`, source: "Simulated demo ledger", tone: "positive" }),
      openInvoiceValue: metric({ label: "Open Invoice Value", value: openInvoiceValue, previous: null, detail: "Total value of invoices with a remaining balance.", source: "Simulated demo ledger" }),
      failedPayments: metric({ label: "Failed Payments / Sync Issues", value: failedPayments, kind: "number", previous: null, detail: `${failedPayments} membership payment${failedPayments === 1 ? "" : "s"} past due; no sync issues.`, source: "Simulated demo ledger", tone: failedPayments ? "danger" : "positive" }),
      invoiceSales: metric({ label: "Invoice Sales", value: invoiceSales, previous: previousInvoiceSales, detail: "Invoices issued in range, excluding voids and write-offs.", source: "Simulated demo ledger" }),
      quoteValue: metric({ label: "Quote Value Created", value: quoteValue, previous: null, detail: `${money(approvedQuoteValue)} approved or converted.`, source: "Simulated demo ledger" }),
      averageInvoiceValue: metric({ label: "Average Invoice Value", value: Math.round(invoiceSales / invoiceCount), previous: null, detail: `${invoiceCount} invoices in range.`, source: "Simulated demo ledger" }),
      averageDaysToPayment: metric({ label: "Average Days To Payment", value: 8.6, kind: "number", previous: null, detail: "Calculated from invoice issue date to payment date.", source: "Simulated demo ledger" }),
    },
    kpis: {
      quoteTurnaroundHours: 13.4,
      quoteTurnaroundSampleSize: Math.max(1, wonQuotes.length),
      quoteWinRatePct: resolved ? (wonQuotes.length / resolved) * 100 : null,
      quoteCounts: { approved: wonQuotes.length, rejected: lostQuotes.length, expired: 0 },
      grossMarginPct: null,
      creditLiability,
      creditLiabilitySubscriptionCount: creditSubscriptions.length,
    },
    charts: {
      revenueOverTime: [...revenueBuckets.entries()].map(([label, value]) => ({ label, value: Math.round(value) })),
      moneyInOut,
      invoiceStatus: topBreakdown(invoiceStatus),
      aging: [...aging.entries()].map(([label, value]) => ({ label, value: Math.round(value) })),
      subscriptionMrr: [...subscriptionBuckets.entries()].map(([label, value]) => ({ label, value: Math.round(value) })),
      expenseCategories: topBreakdown(expenseCategories),
      topClients: topBreakdown(topClients),
      paymentProviderMix: topBreakdown(providerBuckets),
      quotePipeline: topBreakdown(quotePipeline),
    },
    rows: {
      revenue: revenueRows,
      invoices: invoiceRows,
      subscriptions: subscriptionRows,
      expenses: expenseRows,
      clients: [...clientRowMap.values()].sort((a, b) => b.revenue - a.revenue),
      stripeHealth: stripeHealthRows,
    },
    dataGaps: [],
    stripeHealth: {
      mode: "demo",
      lastWebhookReceived: stripeHealthRows[0]?.receivedAt ?? null,
      lastWebhookProcessed: stripeHealthRows[0]?.processedAt ?? null,
      webhookFailures: 0,
      paymentFailures: failedPayments,
      checkoutPending: 0,
      checkoutExpired: 0,
      paymentsNeedingReview: failedPayments,
      amountMismatchCount: 0,
      syncErrorCount: 0,
      disconnectedRecords: 0,
    },
  };
}
