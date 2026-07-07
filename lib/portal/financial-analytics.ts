import "server-only";

import { createServiceClient } from "@/lib/supabase/server";

export type AnalyticsRangeKey =
  | "today"
  | "last_7_days"
  | "last_30_days"
  | "month_to_date"
  | "last_month"
  | "quarter_to_date"
  | "year_to_date"
  | "last_year"
  | "custom";

type MiniProfile = { full_name: string | null; email: string | null; company_name: string | null };
type MiniMission = { ref: string | null };
type MiniInvoice = { id: string; invoice_number: string; client_id: string | null; client: MiniProfile | null };
type MiniSubscription = { id: string; plan_name: string | null; status: string; client_id: string | null; client: MiniProfile | null };

export type FinancialAnalyticsFilters = {
  range?: AnalyticsRangeKey;
  from?: string;
  to?: string;
};

export type FinancialMetric = {
  label: string;
  value: number;
  formatted: string;
  kind: "currency" | "number" | "percent";
  delta: number | null;
  deltaLabel: string | null;
  detail: string;
  source: string;
  tone: "default" | "positive" | "warning" | "danger";
};

export type ChartPoint = { label: string; value: number; secondary?: number };
export type BreakdownPoint = { label: string; value: number };

export type RevenueRow = {
  id: string;
  date: string;
  source: "invoice" | "subscription";
  provider: string;
  paymentMethod: string;
  client: string;
  reference: string;
  amount: number;
  status: string;
  paidAt: string | null;
  safePaymentId: string | null;
  href: string | null;
};

export type InvoiceAnalyticsRow = {
  id: string;
  invoiceNumber: string;
  client: string;
  amount: number;
  amountDue: number;
  status: string;
  paymentStatus: string;
  dueDate: string | null;
  sentDate: string | null;
  paidDate: string | null;
  daysOutstanding: number | null;
  overdueBucket: string;
  provider: string;
  syncStatus: string;
  href: string;
};

export type SubscriptionAnalyticsRow = {
  id: string;
  client: string;
  plan: string;
  interval: string;
  amount: number;
  normalizedMrr: number;
  status: string;
  currentPeriodEnd: string | null;
  paymentStatus: string;
  syncStatus: string;
  lastSynced: string | null;
  href: string;
};

export type ExpenseAnalyticsRow = {
  id: string;
  date: string;
  vendor: string;
  category: string;
  amount: number;
  approvedAmount: number | null;
  reimbursable: boolean;
  billableToClient: boolean;
  linkedClientOrMission: string;
  notes: string | null;
  status: string;
};

export type ClientFinancialRow = {
  id: string;
  client: string;
  revenue: number;
  pending: number;
  overdue: number;
  invoices: number;
  activeSubscriptions: number;
  failedPayments: number;
};

export type StripeHealthRow = {
  id: string;
  eventType: string;
  stripeEventId: string;
  status: string;
  receivedAt: string | null;
  processedAt: string | null;
  subscriptionId: string | null;
  invoiceId: string | null;
  error: string | null;
};

export type FinancialKpis = {
  /** Average hours from sent_at to approved_at for quotes approved in the period; null when no quote has both timestamps. */
  quoteTurnaroundHours: number | null;
  quoteTurnaroundSampleSize: number;
  /** approved / (approved + rejected + expired) as a 0-100 percentage over quotes resolved in the period; null when none resolved. */
  quoteWinRatePct: number | null;
  quoteCounts: { approved: number; rejected: number; expired: number };
  /** Always null: invoice_line_items has no internal cost column, so margin is never estimated. See dataGaps. */
  grossMarginPct: number | null;
  /** Outstanding credit_balance across non-cancelled client subscriptions (point in time, not period-scoped). */
  creditLiability: number;
  creditLiabilitySubscriptionCount: number;
};

export type FinancialAnalyticsData = {
  reportedAt: string;
  dateRange: {
    key: AnalyticsRangeKey;
    label: string;
    from: string;
    to: string;
    previousFrom: string;
    previousTo: string;
  };
  metrics: Record<string, FinancialMetric>;
  kpis: FinancialKpis;
  charts: {
    revenueOverTime: ChartPoint[];
    moneyInOut: ChartPoint[];
    invoiceStatus: BreakdownPoint[];
    aging: BreakdownPoint[];
    subscriptionMrr: ChartPoint[];
    expenseCategories: BreakdownPoint[];
    topClients: BreakdownPoint[];
    paymentProviderMix: BreakdownPoint[];
    quotePipeline: BreakdownPoint[];
  };
  rows: {
    revenue: RevenueRow[];
    invoices: InvoiceAnalyticsRow[];
    subscriptions: SubscriptionAnalyticsRow[];
    expenses: ExpenseAnalyticsRow[];
    clients: ClientFinancialRow[];
    stripeHealth: StripeHealthRow[];
  };
  dataGaps: string[];
  stripeHealth: {
    mode: string;
    lastWebhookReceived: string | null;
    lastWebhookProcessed: string | null;
    webhookFailures: number;
    paymentFailures: number;
    checkoutPending: number;
    checkoutExpired: number;
    paymentsNeedingReview: number;
    amountMismatchCount: number;
    syncErrorCount: number;
    disconnectedRecords: number;
  };
};

type InvoiceRow = {
  id: string;
  invoice_number: string;
  client_id: string | null;
  status: string;
  subtotal: number | string | null;
  total: number | string | null;
  amount_paid: number | string | null;
  amount_due: number | string | null;
  created_at: string;
  issued_at: string | null;
  sent_at: string | null;
  paid_at: string | null;
  due_date: string | null;
  currency: string | null;
  quote_id: string | null;
  stripe_payment_status?: string | null;
  payment_status?: string | null;
  payment_provider?: string | null;
  payment_error?: string | null;
  payment_amount_cents?: number | null;
  payment_currency?: string | null;
  stripe_checkout_session_id?: string | null;
  stripe_payment_intent_id?: string | null;
  client: MiniProfile | null;
  mission: MiniMission | null;
  quote: { ref: string | null } | null;
};

type PaymentRow = {
  id: string;
  invoice_id: string;
  amount: number | string | null;
  currency: string | null;
  paid_at: string;
  created_at: string;
  payment_method: string | null;
  provider: string | null;
  provider_payment_id: string | null;
  status: string;
  invoice: MiniInvoice | null;
};

type QuoteRow = {
  id: string;
  ref: string;
  client_id: string | null;
  status: string;
  total: number | string | null;
  subtotal: number | string | null;
  created_at: string;
  approved_at?: string | null;
  rejected_at?: string | null;
  expires_at?: string | null;
  sent_at?: string | null;
  client: MiniProfile | null;
};

type ExpenseRow = {
  id: string;
  amount: number | string | null;
  approved_amount: number | string | null;
  category: string;
  merchant: string | null;
  status: string;
  expense_date: string;
  created_at: string;
  reimbursable: boolean;
  billable_to_client: boolean;
  notes: string | null;
  mission: MiniMission | null;
  crew: MiniProfile | null;
};

type SubscriptionRow = {
  id: string;
  client_id: string | null;
  status: string;
  billing_cadence: string;
  monthly_price: number | string | null;
  annual_price: number | string | null;
  custom_price: number | string | null;
  amount_cents?: number | null;
  credit_balance?: number | string | null;
  plan_name?: string | null;
  created_at: string;
  current_period_end?: string | null;
  renewal_date: string | null;
  stripe_payment_status?: string | null;
  stripe_sync_status?: string | null;
  stripe_last_synced_at?: string | null;
  stripe_mode?: string | null;
  stripe_checkout_session_id?: string | null;
  stripe_subscription_id?: string | null;
  stripe_sync_warning?: string | null;
  client: MiniProfile | null;
  plan: { name: string | null } | null;
  tier: { name: string | null; monthly_price: number | string | null; annual_price: number | string | null } | null;
};

type SubscriptionInvoiceRow = {
  id: string;
  subscription_id: string | null;
  client_id: string | null;
  amount_due: number | string | null;
  amount_paid: number | string | null;
  status: string | null;
  payment_status: string | null;
  paid_at: string | null;
  created_at: string;
  stripe_invoice_id: string;
  stripe_invoice_number: string | null;
  stripe_subscription_id: string | null;
  subscription: MiniSubscription | null;
  client: MiniProfile | null;
};

type StripeEventRow = {
  id: string;
  stripe_event_id: string;
  type: string;
  event_type?: string | null;
  status: string;
  error: string | null;
  received_at?: string | null;
  processed_at: string | null;
  created_at: string;
  stripe_subscription_id?: string | null;
  stripe_invoice_id?: string | null;
  portal_subscription_id?: string | null;
};

const RANGE_LABELS: Record<AnalyticsRangeKey, string> = {
  today: "Today",
  last_7_days: "Last 7 days",
  last_30_days: "Last 30 days",
  month_to_date: "Month to date",
  last_month: "Last month",
  quarter_to_date: "Quarter to date",
  year_to_date: "Year to date",
  last_year: "Last year",
  custom: "Custom range",
};

function dollars(value: unknown) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function centsToDollars(value: unknown) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n / 100 : 0;
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

function number(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

function percent(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function iso(date: Date) {
  return date.toISOString();
}

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfQuarter(date: Date) {
  return new Date(date.getFullYear(), Math.floor(date.getMonth() / 3) * 3, 1);
}

function resolveDateRange(filters: FinancialAnalyticsFilters = {}) {
  const now = new Date();
  const key = filters.range ?? "month_to_date";
  let from: Date;
  let to: Date;

  switch (key) {
    case "today":
      from = startOfDay(now);
      to = endOfDay(now);
      break;
    case "last_7_days":
      from = startOfDay(addDays(now, -6));
      to = endOfDay(now);
      break;
    case "last_30_days":
      from = startOfDay(addDays(now, -29));
      to = endOfDay(now);
      break;
    case "last_month": {
      const monthStart = startOfMonth(now);
      from = startOfMonth(addDays(monthStart, -1));
      to = endOfDay(addDays(monthStart, -1));
      break;
    }
    case "quarter_to_date":
      from = startOfQuarter(now);
      to = endOfDay(now);
      break;
    case "year_to_date":
      from = new Date(now.getFullYear(), 0, 1);
      to = endOfDay(now);
      break;
    case "last_year":
      from = new Date(now.getFullYear() - 1, 0, 1);
      to = endOfDay(new Date(now.getFullYear() - 1, 11, 31));
      break;
    case "custom":
      from = filters.from ? startOfDay(new Date(`${filters.from}T00:00:00`)) : startOfDay(addDays(now, -29));
      to = filters.to ? endOfDay(new Date(`${filters.to}T00:00:00`)) : endOfDay(now);
      break;
    case "month_to_date":
    default:
      from = startOfMonth(now);
      to = endOfDay(now);
      break;
  }

  const duration = Math.max(1, to.getTime() - from.getTime());
  const previousTo = new Date(from.getTime() - 1);
  const previousFrom = new Date(previousTo.getTime() - duration);

  return {
    key,
    label: key === "custom" && filters.from && filters.to ? `${filters.from} to ${filters.to}` : RANGE_LABELS[key],
    from: iso(from),
    to: iso(to),
    previousFrom: iso(previousFrom),
    previousTo: iso(previousTo),
  };
}

function isBetween(value: string | null | undefined, from: string, to: string) {
  if (!value) return false;
  const time = new Date(value).getTime();
  return time >= new Date(from).getTime() && time <= new Date(to).getTime();
}

function clientName(client: MiniProfile | null | undefined) {
  return client?.company_name ?? client?.full_name ?? client?.email ?? "Unassigned client";
}

function normalizedProvider(provider: string | null | undefined, method?: string | null) {
  const raw = (provider ?? method ?? "manual").toLowerCase();
  if (raw.includes("stripe") || raw.includes("card")) return "Stripe";
  if (raw.includes("wire")) return "Wire";
  if (raw.includes("zelle")) return "Zelle";
  if (raw.includes("ach")) return "ACH";
  if (raw.includes("check")) return "Check";
  if (raw.includes("manual")) return "Manual";
  return raw ? raw.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "Other";
}

function percentDelta(current: number, previous: number) {
  if (previous === 0) return current === 0 ? null : 100;
  return ((current - previous) / previous) * 100;
}

function metric(input: {
  label: string;
  value: number;
  kind?: "currency" | "number" | "percent";
  previous?: number | null;
  detail: string;
  source: string;
  tone?: FinancialMetric["tone"];
}): FinancialMetric {
  const kind = input.kind ?? "currency";
  const delta = input.previous === null || input.previous === undefined ? null : percentDelta(input.value, input.previous);
  return {
    label: input.label,
    value: input.value,
    formatted: kind === "currency" ? money(input.value) : kind === "percent" ? `${input.value.toFixed(1)}%` : number(input.value),
    kind,
    delta,
    deltaLabel: delta === null ? "No comparison data" : `${percent(delta)} vs previous period`,
    detail: input.detail,
    source: input.source,
    tone: input.tone ?? (delta !== null && delta < 0 ? "warning" : "default"),
  };
}

function daysBetween(from: string, to: string) {
  return Math.ceil((new Date(to).getTime() - new Date(from).getTime()) / 86_400_000);
}

function daysOutstanding(invoice: InvoiceRow) {
  const start = invoice.sent_at ?? invoice.issued_at ?? invoice.created_at;
  const end = invoice.paid_at ?? new Date().toISOString();
  return daysBetween(start, end);
}

function agingBucket(invoice: InvoiceRow) {
  if (dollars(invoice.amount_due) <= 0 || invoice.status === "paid") return "Paid";
  if (!invoice.due_date) return "No due date";
  const overdueDays = daysBetween(invoice.due_date, new Date().toISOString());
  if (overdueDays <= 0) return "Current";
  if (overdueDays <= 30) return "1-30 days";
  if (overdueDays <= 60) return "31-60 days";
  if (overdueDays <= 90) return "61-90 days";
  return "90+ days";
}

function subscriptionMrr(subscription: SubscriptionRow) {
  if (subscription.amount_cents) {
    const amount = centsToDollars(subscription.amount_cents);
    return subscription.billing_cadence === "annual" ? amount / 12 : amount;
  }
  const custom = subscription.custom_price === null || subscription.custom_price === undefined ? null : dollars(subscription.custom_price);
  if (custom !== null && custom > 0) {
    return subscription.billing_cadence === "annual" ? custom / 12 : custom;
  }
  if (subscription.billing_cadence === "annual") return dollars(subscription.annual_price) / 12;
  return dollars(subscription.monthly_price);
}

function addToMap(map: Map<string, number>, label: string, amount: number) {
  map.set(label, (map.get(label) ?? 0) + amount);
}

function topBreakdown(map: Map<string, number>, limit = 8): BreakdownPoint[] {
  return [...map.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

function monthKey(value: string) {
  const d = new Date(value);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function shortDateKey(value: string) {
  const d = new Date(value);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function timeBucket(value: string, rangeDays: number) {
  return rangeDays > 62 ? monthKey(value) : shortDateKey(value);
}

function safeId(value: string | null | undefined) {
  if (!value) return null;
  if (value.length <= 18) return value;
  return `${value.slice(0, 8)}...${value.slice(-6)}`;
}

export async function getFinancialAnalytics(filters: FinancialAnalyticsFilters = {}): Promise<FinancialAnalyticsData> {
  const dateRange = resolveDateRange(filters);
  const db = (await createServiceClient()) as any;

  const [
    invoicesResult,
    paymentsResult,
    quotesResult,
    expensesResult,
    subscriptionsResult,
    subscriptionInvoicesResult,
    stripeEventsResult,
  ] = await Promise.all([
    db
      .from("invoices")
      .select("*, client:client_id(full_name,email,company_name), mission:mission_id(ref), quote:quote_id(ref)")
      .order("created_at", { ascending: false }),
    db
      .from("payments")
      .select("*, invoice:invoice_id(id,invoice_number,client_id,client:client_id(full_name,email,company_name))")
      .order("paid_at", { ascending: false }),
    db.from("quotes").select("*, client:client_id(full_name,email,company_name)").order("created_at", { ascending: false }),
    db.from("expenses").select("*, mission:mission_id(ref), crew:crew_id(full_name,email,company_name)").order("created_at", { ascending: false }),
    db
      .from("client_subscriptions")
      .select("*, client:client_id(full_name,email,company_name), plan:plan_id(name), tier:tier_id(name,monthly_price,annual_price)")
      .eq("is_test", false)
      .order("created_at", { ascending: false }),
    db
      .from("subscription_billing_invoices")
      .select("*, subscription:subscription_id(id,plan_name,status,client_id,client:client_id(full_name,email,company_name)), client:client_id(full_name,email,company_name)")
      .order("created_at", { ascending: false }),
    db.from("stripe_webhook_events").select("*").order("created_at", { ascending: false }).limit(250),
  ]);

  const invoices = (invoicesResult.data ?? []) as InvoiceRow[];
  const payments = (paymentsResult.data ?? []) as PaymentRow[];
  const quotes = (quotesResult.data ?? []) as QuoteRow[];
  const expenses = (expensesResult.data ?? []) as ExpenseRow[];
  const subscriptions = (subscriptionsResult.data ?? []) as SubscriptionRow[];
  const subscriptionInvoices = (subscriptionInvoicesResult.data ?? []) as SubscriptionInvoiceRow[];
  const stripeEvents = (stripeEventsResult.data ?? []) as StripeEventRow[];

  const inRangePayments = payments.filter((payment) => isBetween(payment.paid_at, dateRange.from, dateRange.to) && !["failed", "void", "refunded"].includes(payment.status));
  const previousPayments = payments.filter((payment) => isBetween(payment.paid_at, dateRange.previousFrom, dateRange.previousTo) && !["failed", "void", "refunded"].includes(payment.status));
  const paidSubscriptionInvoices = subscriptionInvoices.filter((invoice) => invoice.paid_at && Number(invoice.amount_paid ?? 0) > 0);
  const inRangeSubscriptionRevenue = paidSubscriptionInvoices.filter((invoice) => isBetween(invoice.paid_at, dateRange.from, dateRange.to));
  const previousSubscriptionRevenue = paidSubscriptionInvoices.filter((invoice) => isBetween(invoice.paid_at, dateRange.previousFrom, dateRange.previousTo));

  const invoiceRevenue = inRangePayments.reduce((sum, payment) => sum + dollars(payment.amount), 0);
  const subscriptionRevenue = inRangeSubscriptionRevenue.reduce((sum, invoice) => sum + dollars(invoice.amount_paid), 0);
  const previousRevenue =
    previousPayments.reduce((sum, payment) => sum + dollars(payment.amount), 0) +
    previousSubscriptionRevenue.reduce((sum, invoice) => sum + dollars(invoice.amount_paid), 0);
  const collectedRevenue = invoiceRevenue + subscriptionRevenue;

  const inRangeExpenses = expenses.filter((expense) => isBetween(expense.expense_date ?? expense.created_at, dateRange.from, dateRange.to));
  const previousExpenses = expenses.filter((expense) => isBetween(expense.expense_date ?? expense.created_at, dateRange.previousFrom, dateRange.previousTo));
  const moneyOut = inRangeExpenses.reduce((sum, expense) => sum + dollars(expense.approved_amount ?? expense.amount), 0);
  const previousMoneyOut = previousExpenses.reduce((sum, expense) => sum + dollars(expense.approved_amount ?? expense.amount), 0);

  const inRangeInvoices = invoices.filter((invoice) => isBetween(invoice.issued_at ?? invoice.sent_at ?? invoice.created_at, dateRange.from, dateRange.to));
  const previousInvoices = invoices.filter((invoice) => isBetween(invoice.issued_at ?? invoice.sent_at ?? invoice.created_at, dateRange.previousFrom, dateRange.previousTo));
  const invoiceSales = inRangeInvoices.filter((invoice) => !["void", "written_off"].includes(invoice.status)).reduce((sum, invoice) => sum + dollars(invoice.total), 0);
  const previousInvoiceSales = previousInvoices.filter((invoice) => !["void", "written_off"].includes(invoice.status)).reduce((sum, invoice) => sum + dollars(invoice.total), 0);

  const inRangeQuotes = quotes.filter((quote) => isBetween((quote as any).sent_at ?? quote.created_at, dateRange.from, dateRange.to));
  const quoteValue = inRangeQuotes.reduce((sum, quote) => sum + dollars(quote.total), 0);
  const approvedQuoteValue = inRangeQuotes.filter((quote) => ["approved", "accepted", "converted"].includes(quote.status)).reduce((sum, quote) => sum + dollars(quote.total), 0);

  // Quote KPIs use resolution facts, not just timestamps the happy path sets:
  // - Wins: approved_at when present; a quote converted straight to invoice
  //   without a client approval (admin "create + send") never gets
  //   approved_at, so status "converted" counts as a win windowed on its
  //   updated_at fallback — otherwise verbal-approval deals vanish from the
  //   numerator while losses still count.
  // - Expiries are data-driven (expires_at in the past) rather than relying
  //   on the nightly cron having flipped status, so the rate is correct even
  //   before CRON_SECRET is configured and for same-day windows.
  const approvedQuotesInRange = quotes.filter((quote) =>
    quote.approved_at
      ? isBetween(quote.approved_at, dateRange.from, dateRange.to)
      : quote.status === "converted" && isBetween((quote as any).updated_at ?? quote.created_at, dateRange.from, dateRange.to)
  );
  const rejectedQuotesInRange = quotes.filter((quote) => isBetween(quote.rejected_at, dateRange.from, dateRange.to)).length;
  const nowIso = new Date().toISOString();
  const expiredQuotesInRange = quotes.filter(
    (quote) =>
      ["sent", "viewed", "expired"].includes(quote.status) &&
      !quote.approved_at &&
      !quote.rejected_at &&
      quote.expires_at &&
      quote.expires_at < nowIso &&
      isBetween(quote.expires_at, dateRange.from, dateRange.to)
  ).length;
  const resolvedQuoteCount = approvedQuotesInRange.length + rejectedQuotesInRange + expiredQuotesInRange;
  const quoteWinRatePct = resolvedQuoteCount ? (approvedQuotesInRange.length / resolvedQuoteCount) * 100 : null;
  const turnaroundSamples = approvedQuotesInRange
    .map((quote) => (quote.sent_at && quote.approved_at ? (new Date(quote.approved_at).getTime() - new Date(quote.sent_at).getTime()) / 3_600_000 : null))
    .filter((hours): hours is number => hours !== null && Number.isFinite(hours) && hours >= 0);
  const quoteTurnaroundHours = turnaroundSamples.length ? turnaroundSamples.reduce((sum, value) => sum + value, 0) / turnaroundSamples.length : null;

  const pendingInvoices = invoices.filter((invoice) => dollars(invoice.amount_due) > 0 && !["draft", "void", "written_off", "paid", "refunded"].includes(invoice.status));
  const pendingPayments = pendingInvoices.reduce((sum, invoice) => sum + dollars(invoice.amount_due), 0);
  const overdueInvoices = pendingInvoices.filter((invoice) => invoice.due_date && daysBetween(invoice.due_date, new Date().toISOString()) > 0);
  const overdueAmount = overdueInvoices.reduce((sum, invoice) => sum + dollars(invoice.amount_due), 0);
  const openInvoiceValue = pendingInvoices.reduce((sum, invoice) => sum + dollars(invoice.total), 0);

  const activeSubscriptions = subscriptions.filter((subscription) => ["active", "trialing"].includes(subscription.status));
  const mrr = activeSubscriptions.reduce((sum, subscription) => sum + subscriptionMrr(subscription), 0);
  // Liability only counts subscriptions that are (or were) live. Terminal and
  // never-activated states are excluded — an operator-seeded starting credit
  // on an abandoned pending_checkout is not money AMG owes anyone. Both
  // "canceled" (Stripe) and "cancelled" (portal) spellings exist.
  const NON_LIABILITY_STATUSES = [
    "canceled",
    "cancelled",
    "draft",
    "pending_checkout",
    "incomplete",
    "incomplete_expired",
    "expired",
  ];
  const creditSubscriptions = subscriptions.filter(
    (subscription) => !NON_LIABILITY_STATUSES.includes(subscription.status)
  );
  const creditLiability = creditSubscriptions.reduce((sum, subscription) => sum + dollars(subscription.credit_balance), 0);
  const creditLiabilitySubscriptionCount = creditSubscriptions.filter((subscription) => dollars(subscription.credit_balance) > 0).length;
  const failedSubscriptionPayments = subscriptions.filter((subscription) => ["failed", "past_due", "unpaid"].includes(subscription.stripe_payment_status ?? subscription.status)).length;
  const syncIssueCount = subscriptions.filter((subscription) => ["sync_error", "price_mismatch", "disconnected", "needs_review"].includes(subscription.stripe_sync_status ?? "")).length;

  const rangeDays = Math.max(1, Math.ceil((new Date(dateRange.to).getTime() - new Date(dateRange.from).getTime()) / 86_400_000));
  const revenueBuckets = new Map<string, number>();
  const moneyOutBuckets = new Map<string, number>();
  const subscriptionBuckets = new Map<string, number>();
  const providerBuckets = new Map<string, number>();
  const topClients = new Map<string, number>();

  for (const payment of inRangePayments) {
    addToMap(revenueBuckets, timeBucket(payment.paid_at, rangeDays), dollars(payment.amount));
    addToMap(providerBuckets, normalizedProvider(payment.provider, payment.payment_method), dollars(payment.amount));
    addToMap(topClients, clientName(payment.invoice?.client), dollars(payment.amount));
  }
  for (const invoice of inRangeSubscriptionRevenue) {
    const paidAt = invoice.paid_at ?? invoice.created_at;
    addToMap(revenueBuckets, timeBucket(paidAt, rangeDays), dollars(invoice.amount_paid));
    addToMap(subscriptionBuckets, timeBucket(paidAt, rangeDays), dollars(invoice.amount_paid));
    addToMap(providerBuckets, "Stripe Subscriptions", dollars(invoice.amount_paid));
    addToMap(topClients, clientName(invoice.client ?? invoice.subscription?.client), dollars(invoice.amount_paid));
  }
  for (const expense of inRangeExpenses) {
    addToMap(moneyOutBuckets, timeBucket(expense.expense_date ?? expense.created_at, rangeDays), dollars(expense.approved_amount ?? expense.amount));
  }

  const allTimelineLabels = [...new Set([...revenueBuckets.keys(), ...moneyOutBuckets.keys()])].sort();
  const moneyInOut = allTimelineLabels.map((label) => ({
    label,
    value: revenueBuckets.get(label) ?? 0,
    secondary: moneyOutBuckets.get(label) ?? 0,
  }));

  const invoiceStatus = new Map<string, number>();
  for (const invoice of invoices) addToMap(invoiceStatus, invoice.status, dollars(invoice.total));

  const aging = new Map<string, number>([
    ["Current", 0],
    ["1-30 days", 0],
    ["31-60 days", 0],
    ["61-90 days", 0],
    ["90+ days", 0],
  ]);
  for (const invoice of pendingInvoices) {
    const bucket = agingBucket(invoice);
    if (bucket !== "Paid" && bucket !== "No due date") addToMap(aging, bucket, dollars(invoice.amount_due));
  }

  const expenseCategories = new Map<string, number>();
  for (const expense of inRangeExpenses) addToMap(expenseCategories, expense.category, dollars(expense.approved_amount ?? expense.amount));

  const quotePipeline = new Map<string, number>();
  for (const quote of quotes) addToMap(quotePipeline, quote.status, dollars(quote.total));

  const invoiceRows: InvoiceAnalyticsRow[] = invoices.map((invoice) => ({
    id: invoice.id,
    invoiceNumber: invoice.invoice_number,
    client: clientName(invoice.client),
    amount: dollars(invoice.total),
    amountDue: dollars(invoice.amount_due),
    status: invoice.status,
    paymentStatus: invoice.stripe_payment_status ?? invoice.payment_status ?? (dollars(invoice.amount_due) <= 0 ? "paid" : "open"),
    dueDate: invoice.due_date,
    sentDate: invoice.sent_at ?? invoice.issued_at,
    paidDate: invoice.paid_at,
    daysOutstanding: daysOutstanding(invoice),
    overdueBucket: agingBucket(invoice),
    provider: normalizedProvider(invoice.payment_provider, null),
    syncStatus: invoice.payment_error ? "sync_error" : invoice.stripe_payment_status ?? invoice.payment_status ?? "manual",
    href: `/portal/admin/invoices/${invoice.id}`,
  }));

  const revenueRows: RevenueRow[] = [
    ...payments.map((payment) => ({
      id: payment.id,
      date: payment.paid_at,
      source: "invoice" as const,
      provider: normalizedProvider(payment.provider, payment.payment_method),
      paymentMethod: payment.payment_method ?? "-",
      client: clientName(payment.invoice?.client),
      reference: payment.invoice?.invoice_number ?? payment.invoice_id,
      amount: dollars(payment.amount),
      status: payment.status,
      paidAt: payment.paid_at,
      safePaymentId: safeId(payment.provider_payment_id),
      href: payment.invoice ? `/portal/admin/invoices/${payment.invoice.id}` : null,
    })),
    ...paidSubscriptionInvoices.map((invoice) => ({
      id: invoice.id,
      date: invoice.paid_at ?? invoice.created_at,
      source: "subscription" as const,
      provider: "Stripe Subscriptions",
      paymentMethod: "stripe",
      client: clientName(invoice.client ?? invoice.subscription?.client),
      reference: invoice.stripe_invoice_number ?? invoice.stripe_invoice_id,
      amount: dollars(invoice.amount_paid),
      status: invoice.payment_status ?? invoice.status ?? "paid",
      paidAt: invoice.paid_at,
      safePaymentId: safeId(invoice.stripe_invoice_id),
      href: invoice.subscription_id ? `/portal/admin/subscriptions/${invoice.subscription_id}` : null,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const subscriptionRows: SubscriptionAnalyticsRow[] = subscriptions.map((subscription) => ({
    id: subscription.id,
    client: clientName(subscription.client),
    plan: subscription.plan_name ?? subscription.plan?.name ?? subscription.tier?.name ?? "Custom subscription",
    interval: subscription.billing_cadence,
    amount:
      subscription.amount_cents
        ? centsToDollars(subscription.amount_cents)
        : subscription.billing_cadence === "annual"
          ? dollars(subscription.annual_price)
          : dollars(subscription.custom_price ?? subscription.monthly_price),
    normalizedMrr: subscriptionMrr(subscription),
    status: subscription.status,
    currentPeriodEnd: subscription.current_period_end ?? subscription.renewal_date,
    paymentStatus: subscription.stripe_payment_status ?? "-",
    syncStatus: subscription.stripe_sync_status ?? "manual",
    lastSynced: subscription.stripe_last_synced_at ?? null,
    href: `/portal/admin/subscriptions/${subscription.id}`,
  }));

  const expenseRows: ExpenseAnalyticsRow[] = expenses.map((expense) => ({
    id: expense.id,
    date: expense.expense_date,
    vendor: expense.merchant ?? expense.crew?.company_name ?? expense.crew?.full_name ?? "Unspecified",
    category: expense.category,
    amount: dollars(expense.amount),
    approvedAmount: expense.approved_amount === null ? null : dollars(expense.approved_amount),
    reimbursable: expense.reimbursable,
    billableToClient: expense.billable_to_client,
    linkedClientOrMission: expense.mission?.ref ?? "General",
    notes: expense.notes,
    status: expense.status,
  }));

  const clientMap = new Map<string, ClientFinancialRow>();
  function ensureClient(id: string | null, name: string) {
    const key = id ?? name;
    if (!clientMap.has(key)) {
      clientMap.set(key, { id: key, client: name, revenue: 0, pending: 0, overdue: 0, invoices: 0, activeSubscriptions: 0, failedPayments: 0 });
    }
    return clientMap.get(key)!;
  }
  for (const payment of payments) {
    const row = ensureClient(payment.invoice?.client_id ?? null, clientName(payment.invoice?.client));
    row.revenue += dollars(payment.amount);
  }
  for (const invoice of invoices) {
    const row = ensureClient(invoice.client_id, clientName(invoice.client));
    row.pending += dollars(invoice.amount_due);
    row.invoices += 1;
    if (overdueInvoices.some((item) => item.id === invoice.id)) row.overdue += dollars(invoice.amount_due);
  }
  for (const subscription of subscriptions) {
    const row = ensureClient(subscription.client_id, clientName(subscription.client));
    if (["active", "trialing"].includes(subscription.status)) row.activeSubscriptions += 1;
    if (["failed", "past_due", "unpaid"].includes(subscription.stripe_payment_status ?? subscription.status)) row.failedPayments += 1;
  }

  const stripeHealthRows: StripeHealthRow[] = stripeEvents.map((event) => ({
    id: event.id,
    eventType: event.event_type ?? event.type,
    stripeEventId: event.stripe_event_id,
    status: event.status,
    receivedAt: event.received_at ?? event.created_at,
    processedAt: event.processed_at,
    subscriptionId: event.portal_subscription_id ?? event.stripe_subscription_id ?? null,
    invoiceId: event.stripe_invoice_id ?? null,
    error: event.error,
  }));

  const currentMonthStart = startOfMonth(new Date());
  const currentYearStart = new Date(new Date().getFullYear(), 0, 1);
  const currentMonthRevenue =
    payments.filter((payment) => isBetween(payment.paid_at, iso(currentMonthStart), dateRange.to)).reduce((sum, payment) => sum + dollars(payment.amount), 0) +
    paidSubscriptionInvoices.filter((invoice) => invoice.paid_at && isBetween(invoice.paid_at, iso(currentMonthStart), dateRange.to)).reduce((sum, invoice) => sum + dollars(invoice.amount_paid), 0);
  const currentYearRevenue =
    payments.filter((payment) => isBetween(payment.paid_at, iso(currentYearStart), dateRange.to)).reduce((sum, payment) => sum + dollars(payment.amount), 0) +
    paidSubscriptionInvoices.filter((invoice) => invoice.paid_at && isBetween(invoice.paid_at, iso(currentYearStart), dateRange.to)).reduce((sum, invoice) => sum + dollars(invoice.amount_paid), 0);

  const averageDaysToPaymentValues = invoices.filter((invoice) => invoice.paid_at).map(daysOutstanding);
  const averageDaysToPayment = averageDaysToPaymentValues.length
    ? averageDaysToPaymentValues.reduce((sum, value) => sum + value, 0) / averageDaysToPaymentValues.length
    : 0;

  const lastWebhookReceived = stripeEvents[0]?.received_at ?? stripeEvents[0]?.created_at ?? null;
  const lastWebhookProcessed = stripeEvents.find((event) => event.processed_at)?.processed_at ?? null;
  const webhookFailures = stripeEvents.filter((event) => ["failed", "retry_needed"].includes(event.status)).length;
  const paymentFailures = stripeEvents.filter((event) => (event.event_type ?? event.type).includes("payment_failed")).length + failedSubscriptionPayments;
  const checkoutPending = subscriptions.filter((subscription) => subscription.stripe_sync_status === "pending_checkout").length;
  const checkoutExpired = stripeEvents.filter((event) => (event.event_type ?? event.type) === "checkout.session.expired").length;
  const amountMismatchCount = invoices.filter((invoice) => invoice.payment_amount_cents && Math.round(dollars(invoice.amount_due) * 100) !== invoice.payment_amount_cents && dollars(invoice.amount_due) > 0).length;
  const disconnectedRecords = subscriptions.filter((subscription) => subscription.stripe_sync_status === "disconnected").length;

  const dataGaps: string[] = [];
  if (!expenses.length) dataGaps.push("Expense tracking is configured, but no expenses are recorded yet.");
  if (!subscriptionInvoices.length) dataGaps.push("Stripe subscription invoice sync has no recorded billing invoices yet; subscription revenue may be limited to portal subscription setup data.");
  if (!stripeEvents.length) dataGaps.push("No Stripe webhook events are recorded yet; Stripe health metrics will stay unavailable until webhooks arrive.");
  if (!invoices.some((invoice) => invoice.paid_at) && !payments.length) dataGaps.push("No paid invoice records were found; collected revenue will remain zero until payments are recorded.");
  dataGaps.push("Invoice line items do not record an internal cost, so gross margin is left blank rather than estimated.");

  return {
    reportedAt: new Date().toISOString(),
    dateRange,
    metrics: {
      moneyIn: metric({ label: "Money In", value: collectedRevenue, previous: previousRevenue, detail: "Collected invoice payments plus paid Stripe subscription invoices.", source: "payments, subscription_billing_invoices", tone: "positive" }),
      moneyOut: metric({ label: "Money Out", value: moneyOut, previous: previousMoneyOut, detail: "Recorded expenses using approved amount when present.", source: "expenses", tone: moneyOut > collectedRevenue ? "warning" : "default" }),
      netCash: metric({ label: "Net Cash Movement", value: collectedRevenue - moneyOut, previous: previousRevenue - previousMoneyOut, detail: "Money In minus Money Out for the selected period.", source: "payments, subscription_billing_invoices, expenses", tone: collectedRevenue - moneyOut < 0 ? "danger" : "positive" }),
      monthlyIncome: metric({ label: "Monthly Income", value: currentMonthRevenue, previous: null, detail: "Collected revenue month to date.", source: "payments, subscription_billing_invoices" }),
      yearlyIncome: metric({ label: "Yearly Income", value: currentYearRevenue, previous: null, detail: "Collected revenue year to date.", source: "payments, subscription_billing_invoices" }),
      pendingPayments: metric({ label: "Pending Payments", value: pendingPayments, previous: null, detail: "Open invoice balances excluding drafts, voids, paid invoices, write-offs, and refunds.", source: "invoices", tone: pendingPayments ? "warning" : "positive" }),
      overdueAmount: metric({ label: "Overdue Amount", value: overdueAmount, previous: null, detail: `${overdueInvoices.length} invoices are past due.`, source: "invoices", tone: overdueAmount ? "danger" : "positive" }),
      activeSubscriptions: metric({ label: "Active Subscriptions", value: activeSubscriptions.length, kind: "number", previous: null, detail: `${money(mrr)} MRR / ${money(mrr * 12)} ARR.`, source: "client_subscriptions", tone: "positive" }),
      openInvoiceValue: metric({ label: "Open Invoice Value", value: openInvoiceValue, previous: null, detail: "Total value of invoices with a remaining balance.", source: "invoices" }),
      failedPayments: metric({ label: "Failed Payments / Sync Issues", value: paymentFailures + syncIssueCount, kind: "number", previous: null, detail: `${paymentFailures} payment failures and ${syncIssueCount} subscription sync issues.`, source: "stripe_webhook_events, client_subscriptions", tone: paymentFailures + syncIssueCount ? "danger" : "positive" }),
      invoiceSales: metric({ label: "Invoice Sales", value: invoiceSales, previous: previousInvoiceSales, detail: "Invoices created or issued in range, excluding voids and write-offs.", source: "invoices" }),
      quoteValue: metric({ label: "Quote Value Created", value: quoteValue, previous: null, detail: `${money(approvedQuoteValue)} approved or converted.`, source: "quotes" }),
      averageInvoiceValue: metric({ label: "Average Invoice Value", value: inRangeInvoices.length ? invoiceSales / inRangeInvoices.length : 0, previous: null, detail: `${inRangeInvoices.length} invoices in range.`, source: "invoices" }),
      averageDaysToPayment: metric({ label: "Average Days To Payment", value: averageDaysToPayment, kind: "number", previous: null, detail: "Calculated from invoice issue/send date to paid_at.", source: "invoices" }),
    },
    kpis: {
      quoteTurnaroundHours,
      quoteTurnaroundSampleSize: turnaroundSamples.length,
      quoteWinRatePct,
      quoteCounts: { approved: approvedQuotesInRange.length, rejected: rejectedQuotesInRange, expired: expiredQuotesInRange },
      grossMarginPct: null,
      creditLiability,
      creditLiabilitySubscriptionCount,
    },
    charts: {
      revenueOverTime: [...revenueBuckets.entries()].sort().map(([label, value]) => ({ label, value })),
      moneyInOut,
      invoiceStatus: topBreakdown(invoiceStatus),
      aging: [...aging.entries()].map(([label, value]) => ({ label, value })),
      subscriptionMrr: [...subscriptionBuckets.entries()].sort().map(([label, value]) => ({ label, value })),
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
      clients: [...clientMap.values()].sort((a, b) => b.revenue - a.revenue),
      stripeHealth: stripeHealthRows,
    },
    dataGaps,
    stripeHealth: {
      mode: subscriptions.find((subscription) => subscription.stripe_mode)?.stripe_mode ?? (process.env.STRIPE_SECRET_KEY?.startsWith("sk_live_") ? "live" : process.env.STRIPE_SECRET_KEY ? "test" : "unconfigured"),
      lastWebhookReceived,
      lastWebhookProcessed,
      webhookFailures,
      paymentFailures,
      checkoutPending,
      checkoutExpired,
      paymentsNeedingReview: failedSubscriptionPayments + syncIssueCount,
      amountMismatchCount,
      syncErrorCount: syncIssueCount,
      disconnectedRecords,
    },
  };
}
