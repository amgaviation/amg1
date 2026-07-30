import "server-only";

/**
 * Simulated sample dataset for the Demo Portal (/portal/demo).
 *
 * Every record here is fictional: invented companies, people, tail numbers,
 * and amounts, written to look like a healthy AMG operation (aircraft
 * management support, contract crew, ferry/MX repositioning, memberships).
 * Demo pages render exclusively from this module — a demo login never reads
 * operational rows, so nothing on these pages can leak live data.
 *
 * Dates are computed relative to "now" on every call so the sandbox always
 * looks current: departures sit in the next two weeks, invoices age
 * realistically, and message threads read as this week's traffic.
 */

export type DemoClient = {
  id: string;
  company: string;
  contact: string;
  email: string;
  homeBase: string;
  aircraft: string[];
  plan: string | null;
  status: "active" | "prospect";
  memberSinceDaysAgo: number;
  ytdRevenue: number;
  arOutstanding: number;
};

export type DemoAircraft = {
  tail: string;
  type: string;
  owner: string;
  base: string;
  airworthiness: "airworthy" | "mx_hold";
  nextMxDueDays: number;
  totalTimeHours: number;
};

export type DemoCrewMember = {
  id: string;
  name: string;
  crewRole: "pic" | "sic";
  ratings: string[];
  homeBase: string;
  availability: "available" | "limited" | "unavailable";
  medicalDueDays: number;
  credentialStatus: "approved" | "expiring" | "pending_review";
  missionsYtd: number;
  dayRate: number;
};

export type DemoMission = {
  id: string;
  ref: string;
  type: string;
  status: string;
  urgency: "standard" | "priority" | "aog";
  client: string;
  aircraft: string;
  departure: string;
  arrival: string;
  departsInDays: number;
  crew: string | null;
  summary: string;
};

export type DemoQuote = {
  id: string;
  ref: string;
  client: string;
  missionRef: string | null;
  total: number;
  status: string;
  sentDaysAgo: number | null;
  expiresInDays: number | null;
};

export type DemoInvoice = {
  id: string;
  number: string;
  client: string;
  total: number;
  amountDue: number;
  status: string;
  issuedDaysAgo: number;
  dueInDays: number;
  paidDaysAgo: number | null;
};

export type DemoExpense = {
  id: string;
  submittedBy: string;
  category: string;
  merchant: string;
  amount: number;
  missionRef: string;
  status: string;
  daysAgo: number;
};

export type DemoSubscription = {
  id: string;
  client: string;
  plan: string;
  cadence: "monthly" | "annual";
  amount: number;
  mrr: number;
  status: "active" | "trialing" | "past_due";
  periodEndDays: number;
  creditBalance: number;
};

export type DemoMessage = { from: string; hoursAgo: number; body: string };

export type DemoThread = {
  id: string;
  subject: string;
  counterpart: string;
  counterpartRole: string;
  unread: boolean;
  messages: DemoMessage[];
};

export type DemoNotification = {
  id: string;
  title: string;
  body: string;
  hoursAgo: number;
  tone: "neutral" | "info" | "warn" | "success" | "danger";
  icon: string;
};

export type DemoTask = {
  id: string;
  title: string;
  priority: "urgent" | "high" | "normal";
  dueInDays: number | null;
};

export type DemoActivity = {
  id: string;
  action: string;
  detail: string;
  hoursAgo: number;
};

export const DEMO_CLIENTS: DemoClient[] = [
  { id: "dc-01", company: "Meridian Capital Partners", contact: "Grant Whitfield", email: "gwhitfield@example.com", homeBase: "KTEB", aircraft: ["N735MC"], plan: "Flight Support — Gold", status: "active", memberSinceDaysAgo: 660, ytdRevenue: 212400, arOutstanding: 18750 },
  { id: "dc-02", company: "Blue Horizon Energy", contact: "Dana Kowalski", email: "dkowalski@example.com", homeBase: "KHOU", aircraft: ["N612BH"], plan: "Flight Support — Gold", status: "active", memberSinceDaysAgo: 540, ytdRevenue: 187900, arOutstanding: 42300 },
  { id: "dc-03", company: "Pacific Gate Ventures", contact: "Elaine Marsh", email: "emarsh@example.com", homeBase: "KVNY", aircraft: ["N904PG"], plan: "Flight Support — Gold", status: "active", memberSinceDaysAgo: 430, ytdRevenue: 164200, arOutstanding: 0 },
  { id: "dc-04", company: "Sterling Family Office", contact: "Rob Calloway", email: "rcalloway@example.com", homeBase: "KSDL", aircraft: ["N88SF"], plan: "Flight Support — Silver", status: "active", memberSinceDaysAgo: 380, ytdRevenue: 96800, arOutstanding: 8400 },
  { id: "dc-05", company: "Crestwood Health Group", contact: "Dr. Alicia Monroe", email: "amonroe@example.com", homeBase: "KBNA", aircraft: ["N421CW"], plan: "Flight Support — Silver", status: "active", memberSinceDaysAgo: 300, ytdRevenue: 88100, arOutstanding: 12900 },
  { id: "dc-06", company: "Lakeshore Holdings", contact: "Victor Brandt", email: "vbrandt@example.com", homeBase: "KPWK", aircraft: ["N277LH"], plan: "Flight Support — Core", status: "active", memberSinceDaysAgo: 245, ytdRevenue: 71500, arOutstanding: 24600 },
  { id: "dc-07", company: "Ironwood Development", contact: "Sofia Reyes", email: "sreyes@example.com", homeBase: "KAPA", aircraft: ["N350IW"], plan: "Flight Support — Core", status: "active", memberSinceDaysAgo: 190, ytdRevenue: 54200, arOutstanding: 0 },
  { id: "dc-08", company: "Summit Aviation Trust", contact: "Neil Okada", email: "nokada@example.com", homeBase: "KBZN", aircraft: ["N128ST"], plan: null, status: "prospect", memberSinceDaysAgo: 60, ytdRevenue: 18400, arOutstanding: 6200 },
];

export const DEMO_AIRCRAFT: DemoAircraft[] = [
  { tail: "N735MC", type: "Bombardier Challenger 350", owner: "Meridian Capital Partners", base: "KTEB", airworthiness: "airworthy", nextMxDueDays: 44, totalTimeHours: 2840 },
  { tail: "N612BH", type: "Gulfstream G550", owner: "Blue Horizon Energy", base: "KHOU", airworthiness: "airworthy", nextMxDueDays: 21, totalTimeHours: 6120 },
  { tail: "N904PG", type: "Bombardier Global 6000", owner: "Pacific Gate Ventures", base: "KVNY", airworthiness: "airworthy", nextMxDueDays: 96, totalTimeHours: 4310 },
  { tail: "N88SF", type: "Embraer Phenom 300E", owner: "Sterling Family Office", base: "KSDL", airworthiness: "airworthy", nextMxDueDays: 62, totalTimeHours: 1490 },
  { tail: "N421CW", type: "Cessna Citation XLS+", owner: "Crestwood Health Group", base: "KBNA", airworthiness: "airworthy", nextMxDueDays: 12, totalTimeHours: 3980 },
  { tail: "N277LH", type: "Dassault Falcon 2000LXS", owner: "Lakeshore Holdings", base: "KPWK", airworthiness: "mx_hold", nextMxDueDays: -3, totalTimeHours: 5260 },
  { tail: "N350IW", type: "Beechcraft King Air 350i", owner: "Ironwood Development", base: "KAPA", airworthiness: "airworthy", nextMxDueDays: 30, totalTimeHours: 2210 },
  { tail: "N128ST", type: "Pilatus PC-12 NGX", owner: "Summit Aviation Trust", base: "KBZN", airworthiness: "airworthy", nextMxDueDays: 75, totalTimeHours: 880 },
];

export const DEMO_CREW: DemoCrewMember[] = [
  { id: "cr-01", name: "Sarah Mitchell", crewRole: "pic", ratings: ["ATP", "CL-30", "CE-560XL"], homeBase: "KTEB", availability: "available", medicalDueDays: 148, credentialStatus: "approved", missionsYtd: 22, dayRate: 1850 },
  { id: "cr-02", name: "David Okafor", crewRole: "pic", ratings: ["ATP", "G-V", "G550 Intl Ops"], homeBase: "KHOU", availability: "available", medicalDueDays: 94, credentialStatus: "approved", missionsYtd: 18, dayRate: 1950 },
  { id: "cr-03", name: "Jenna Ruiz", crewRole: "sic", ratings: ["ATP", "CE-560XL"], homeBase: "KBNA", availability: "limited", medicalDueDays: 27, credentialStatus: "expiring", missionsYtd: 15, dayRate: 1450 },
  { id: "cr-04", name: "Marcus Webb", crewRole: "pic", ratings: ["ATP", "BD-700", "CL-30"], homeBase: "KVNY", availability: "available", medicalDueDays: 210, credentialStatus: "approved", missionsYtd: 19, dayRate: 1900 },
  { id: "cr-05", name: "Emily Hartman", crewRole: "sic", ratings: ["Commercial", "BE-300"], homeBase: "KAPA", availability: "available", medicalDueDays: 122, credentialStatus: "approved", missionsYtd: 11, dayRate: 1250 },
  { id: "cr-06", name: "Tom Caruso", crewRole: "pic", ratings: ["ATP", "DA-2000EASy"], homeBase: "KPWK", availability: "unavailable", medicalDueDays: 88, credentialStatus: "approved", missionsYtd: 16, dayRate: 1800 },
  { id: "cr-07", name: "Priya Nair", crewRole: "pic", ratings: ["ATP", "EMB-505"], homeBase: "KSDL", availability: "available", medicalDueDays: 176, credentialStatus: "approved", missionsYtd: 14, dayRate: 1600 },
  { id: "cr-08", name: "Jack Donnelly", crewRole: "pic", ratings: ["ATP", "PC-12"], homeBase: "KBZN", availability: "limited", medicalDueDays: 58, credentialStatus: "pending_review", missionsYtd: 9, dayRate: 1400 },
];

export const DEMO_MISSIONS: DemoMission[] = [
  { id: "dm-2454", ref: "AMG-2454", type: "aircraft_support", status: "submitted", urgency: "aog", client: "Blue Horizon Energy", aircraft: "N612BH", departure: "KHOU", arrival: "KELP", departsInDays: 1, crew: null, summary: "AOG recovery support — starter-generator failure at El Paso, parts and contract crew needed on site." },
  { id: "dm-2453", ref: "AMG-2453", type: "passenger_trip", status: "submitted", urgency: "standard", client: "Sterling Family Office", aircraft: "N88SF", departure: "KSDL", arrival: "KASE", departsInDays: 6, crew: null, summary: "Weekend positioning to Aspen, PIC + SIC requested, return leg Sunday evening." },
  { id: "dm-2452", ref: "AMG-2452", type: "crew_reposition", status: "under_review", urgency: "priority", client: "Meridian Capital Partners", aircraft: "N735MC", departure: "KTEB", arrival: "KPBI", departsInDays: 3, crew: null, summary: "Contract PIC to reposition aircraft ahead of owner trip; airline travel outbound." },
  { id: "dm-2451", ref: "AMG-2451", type: "ferry", status: "awaiting_client_info", urgency: "standard", client: "Lakeshore Holdings", aircraft: "N277LH", departure: "KPWK", arrival: "KOPF", departsInDays: 9, crew: null, summary: "Ferry to Opa-locka after MX release — awaiting insurance approval for listed crew." },
  { id: "dm-2449", ref: "AMG-2449", type: "passenger_trip", status: "quoted", urgency: "standard", client: "Pacific Gate Ventures", aircraft: "N904PG", departure: "KVNY", arrival: "PHNL", departsInDays: 12, crew: null, summary: "Honolulu round trip, augmented crew, five-day stay with crew lodging." },
  { id: "dm-2448", ref: "AMG-2448", type: "maintenance_reposition", status: "quoted", urgency: "standard", client: "Ironwood Development", aircraft: "N350IW", departure: "KAPA", arrival: "KICT", departsInDays: 7, crew: null, summary: "Reposition to Wichita for phase inspection; single-pilot ferry, airline return." },
  { id: "dm-2447", ref: "AMG-2447", type: "passenger_trip", status: "approved", urgency: "standard", client: "Crestwood Health Group", aircraft: "N421CW", departure: "KBNA", arrival: "KTEB", departsInDays: 2, crew: null, summary: "Board meeting run to Teterboro — approved, crew assignment in progress." },
  { id: "dm-2446", ref: "AMG-2446", type: "passenger_trip", status: "crew_assigned", urgency: "standard", client: "Meridian Capital Partners", aircraft: "N735MC", departure: "KTEB", arrival: "KMIA", departsInDays: 1, crew: "Sarah Mitchell", summary: "Owner trip to Miami, PIC confirmed, SIC pending schedule release." },
  { id: "dm-2445", ref: "AMG-2445", type: "crew_reposition", status: "scheduled", urgency: "standard", client: "Summit Aviation Trust", aircraft: "N128ST", departure: "KBZN", arrival: "KJAC", departsInDays: 2, crew: "Jack Donnelly", summary: "Jackson Hole shuttle support for owner's guests." },
  { id: "dm-2444", ref: "AMG-2444", type: "passenger_trip", status: "scheduled", urgency: "standard", client: "Blue Horizon Energy", aircraft: "N612BH", departure: "KHOU", arrival: "EGGW", departsInDays: 5, crew: "David Okafor", summary: "London Luton investor roadshow, international ops package, augmented crew." },
  { id: "dm-2443", ref: "AMG-2443", type: "ferry", status: "in_progress", urgency: "standard", client: "Pacific Gate Ventures", aircraft: "N904PG", departure: "KVNY", arrival: "KTEB", departsInDays: 0, crew: "Marcus Webb", summary: "Eastbound ferry ahead of Northeast trip week — airborne, ETA 21:40Z." },
  { id: "dm-2441", ref: "AMG-2441", type: "passenger_trip", status: "completed", urgency: "standard", client: "Sterling Family Office", aircraft: "N88SF", departure: "KSDL", arrival: "KLAS", departsInDays: -2, crew: "Priya Nair", summary: "Las Vegas day trip completed; expenses in review." },
  { id: "dm-2440", ref: "AMG-2440", type: "maintenance_reposition", status: "completed", urgency: "standard", client: "Lakeshore Holdings", aircraft: "N277LH", departure: "KOPF", arrival: "KPWK", departsInDays: -5, crew: "Tom Caruso", summary: "Return from paint and interior refresh at Opa-locka." },
  { id: "dm-2438", ref: "AMG-2438", type: "passenger_trip", status: "cancelled", urgency: "standard", client: "Ironwood Development", aircraft: "N350IW", departure: "KAPA", arrival: "KSUN", departsInDays: -8, crew: null, summary: "Cancelled by client — weather window closed for Sun Valley arrival." },
];

export const DEMO_QUOTES: DemoQuote[] = [
  { id: "dq-01", ref: "Q-1218", client: "Pacific Gate Ventures", missionRef: "AMG-2449", total: 38400, status: "sent", sentDaysAgo: 1, expiresInDays: 6 },
  { id: "dq-02", ref: "Q-1217", client: "Ironwood Development", missionRef: "AMG-2448", total: 6850, status: "viewed", sentDaysAgo: 2, expiresInDays: 5 },
  { id: "dq-03", ref: "Q-1216", client: "Crestwood Health Group", missionRef: "AMG-2447", total: 12600, status: "approved", sentDaysAgo: 4, expiresInDays: null },
  { id: "dq-04", ref: "Q-1215", client: "Blue Horizon Energy", missionRef: "AMG-2444", total: 41200, status: "converted", sentDaysAgo: 8, expiresInDays: null },
  { id: "dq-05", ref: "Q-1214", client: "Meridian Capital Partners", missionRef: "AMG-2446", total: 9750, status: "approved", sentDaysAgo: 6, expiresInDays: null },
  { id: "dq-06", ref: "Q-1213", client: "Summit Aviation Trust", missionRef: "AMG-2445", total: 5400, status: "converted", sentDaysAgo: 9, expiresInDays: null },
  { id: "dq-07", ref: "Q-1212", client: "Lakeshore Holdings", missionRef: "AMG-2451", total: 18900, status: "sent", sentDaysAgo: 3, expiresInDays: 4 },
  { id: "dq-08", ref: "Q-1209", client: "Sterling Family Office", missionRef: null, total: 4200, status: "rejected", sentDaysAgo: 14, expiresInDays: null },
];

export const DEMO_INVOICES: DemoInvoice[] = [
  { id: "di-01", number: "INV-2098", client: "Blue Horizon Energy", total: 41200, amountDue: 41200, status: "sent", issuedDaysAgo: 3, dueInDays: 27, paidDaysAgo: null },
  { id: "di-02", number: "INV-2097", client: "Meridian Capital Partners", total: 9750, amountDue: 0, status: "paid", issuedDaysAgo: 6, dueInDays: 24, paidDaysAgo: 2 },
  { id: "di-03", number: "INV-2096", client: "Crestwood Health Group", total: 12900, amountDue: 12900, status: "viewed", issuedDaysAgo: 8, dueInDays: 22, paidDaysAgo: null },
  { id: "di-04", number: "INV-2095", client: "Sterling Family Office", total: 8400, amountDue: 4200, status: "partially_paid", issuedDaysAgo: 12, dueInDays: 18, paidDaysAgo: 5 },
  { id: "di-05", number: "INV-2094", client: "Summit Aviation Trust", total: 6200, amountDue: 6200, status: "overdue", issuedDaysAgo: 41, dueInDays: -11, paidDaysAgo: null },
  { id: "di-06", number: "INV-2093", client: "Lakeshore Holdings", total: 24600, amountDue: 24600, status: "overdue", issuedDaysAgo: 66, dueInDays: -36, paidDaysAgo: null },
  { id: "di-07", number: "INV-2092", client: "Pacific Gate Ventures", total: 21500, amountDue: 0, status: "paid", issuedDaysAgo: 19, dueInDays: 11, paidDaysAgo: 9 },
  { id: "di-08", number: "INV-2091", client: "Sterling Family Office", total: 5750, amountDue: 0, status: "paid", issuedDaysAgo: 24, dueInDays: 6, paidDaysAgo: 16 },
  { id: "di-09", number: "INV-2090", client: "Ironwood Development", total: 4680, amountDue: 0, status: "paid", issuedDaysAgo: 31, dueInDays: -1, paidDaysAgo: 22 },
  { id: "di-10", number: "INV-2089", client: "Meridian Capital Partners", total: 18750, amountDue: 18750, status: "sent", issuedDaysAgo: 5, dueInDays: 25, paidDaysAgo: null },
];

export const DEMO_EXPENSES: DemoExpense[] = [
  { id: "de-01", submittedBy: "Sarah Mitchell", category: "hotel", merchant: "Harborview Suites MIA", amount: 428.5, missionRef: "AMG-2446", status: "submitted", daysAgo: 0 },
  { id: "de-02", submittedBy: "Priya Nair", category: "airline", merchant: "United Airlines", amount: 512.4, missionRef: "AMG-2441", status: "under_review", daysAgo: 1 },
  { id: "de-03", submittedBy: "Priya Nair", category: "rideshare", merchant: "Uber", amount: 64.2, missionRef: "AMG-2441", status: "under_review", daysAgo: 1 },
  { id: "de-04", submittedBy: "Tom Caruso", category: "hotel", merchant: "Gateway Inn OPF", amount: 386, missionRef: "AMG-2440", status: "approved", daysAgo: 4 },
  { id: "de-05", submittedBy: "Tom Caruso", category: "meals", merchant: "Skyway Grill", amount: 58.75, missionRef: "AMG-2440", status: "approved", daysAgo: 4 },
  { id: "de-06", submittedBy: "Marcus Webb", category: "rental_car", merchant: "Hertz", amount: 189.6, missionRef: "AMG-2443", status: "submitted", daysAgo: 2 },
  { id: "de-07", submittedBy: "David Okafor", category: "airline", merchant: "Delta Air Lines", amount: 634, missionRef: "AMG-2444", status: "approved", daysAgo: 6 },
  { id: "de-08", submittedBy: "Jack Donnelly", category: "fuel", merchant: "Bozeman Jet Center", amount: 1240.8, missionRef: "AMG-2445", status: "added_to_invoice", daysAgo: 8 },
  { id: "de-09", submittedBy: "Sarah Mitchell", category: "parking", merchant: "Teterboro FBO", amount: 95, missionRef: "AMG-2446", status: "reimbursed", daysAgo: 12 },
  { id: "de-10", submittedBy: "Emily Hartman", category: "hotel", merchant: "Summit Lodge ICT", amount: 312.4, missionRef: "AMG-2448", status: "draft", daysAgo: 0 },
];

export const DEMO_SUBSCRIPTIONS: DemoSubscription[] = [
  { id: "ds-01", client: "Meridian Capital Partners", plan: "Flight Support — Gold", cadence: "monthly", amount: 2500, mrr: 2500, status: "active", periodEndDays: 12, creditBalance: 0 },
  { id: "ds-02", client: "Blue Horizon Energy", plan: "Flight Support — Gold", cadence: "monthly", amount: 2500, mrr: 2500, status: "active", periodEndDays: 18, creditBalance: 1500 },
  { id: "ds-03", client: "Pacific Gate Ventures", plan: "Flight Support — Gold", cadence: "annual", amount: 27000, mrr: 2250, status: "active", periodEndDays: 204, creditBalance: 0 },
  { id: "ds-04", client: "Sterling Family Office", plan: "Flight Support — Silver", cadence: "monthly", amount: 1500, mrr: 1500, status: "active", periodEndDays: 9, creditBalance: 0 },
  { id: "ds-05", client: "Crestwood Health Group", plan: "Flight Support — Silver", cadence: "monthly", amount: 1500, mrr: 1500, status: "active", periodEndDays: 22, creditBalance: 3250 },
  { id: "ds-06", client: "Lakeshore Holdings", plan: "Flight Support — Core", cadence: "monthly", amount: 850, mrr: 850, status: "past_due", periodEndDays: -4, creditBalance: 0 },
  { id: "ds-07", client: "Ironwood Development", plan: "Flight Support — Core", cadence: "monthly", amount: 850, mrr: 850, status: "trialing", periodEndDays: 16, creditBalance: 0 },
];

export const DEMO_THREADS: DemoThread[] = [
  {
    id: "th-01",
    subject: "AOG support — N612BH at El Paso",
    counterpart: "Dana Kowalski",
    counterpartRole: "Blue Horizon Energy · Client",
    unread: true,
    messages: [
      { from: "Dana Kowalski", hoursAgo: 5, body: "Aircraft is stuck at KELP with a starter-generator failure. Can AMG coordinate parts and get a crew out to recover it this week?" },
      { from: "AMG Operations", hoursAgo: 4, body: "We're on it. Parts are sourced from Dallas with AOG counter-to-counter shipping, and we're holding David Okafor for the recovery flight. Quote for the full recovery package lands within the hour." },
      { from: "Dana Kowalski", hoursAgo: 2, body: "Perfect — flight department will approve as soon as it hits the portal." },
    ],
  },
  {
    id: "th-02",
    subject: "Availability Aug 12–15",
    counterpart: "Sarah Mitchell",
    counterpartRole: "Contract PIC · Crew",
    unread: true,
    messages: [
      { from: "Sarah Mitchell", hoursAgo: 26, body: "Blocking Aug 12–15 for recurrent training at FlightSafety — updating my availability now so dispatch doesn't schedule over it." },
      { from: "AMG Operations", hoursAgo: 22, body: "Noted and reflected on the crew map. We'll keep the Meridian trips off those dates." },
    ],
  },
  {
    id: "th-03",
    subject: "Fuel release — KTEB arrival N904PG",
    counterpart: "Skyline FBO Services",
    counterpartRole: "FBO Partner",
    unread: false,
    messages: [
      { from: "Skyline FBO Services", hoursAgo: 49, body: "Confirming the fuel release and overnight hangar for N904PG arriving Thursday evening. Contract fuel at $5.48/gal applies." },
      { from: "AMG Operations", hoursAgo: 47, body: "Confirmed on both. Crew car requested for a 09:00 local departure Friday." },
      { from: "Skyline FBO Services", hoursAgo: 45, body: "All set — see you Thursday." },
    ],
  },
  {
    id: "th-04",
    subject: "Aspen slot times this weekend",
    counterpart: "Rob Calloway",
    counterpartRole: "Sterling Family Office · Client",
    unread: false,
    messages: [
      { from: "Rob Calloway", hoursAgo: 73, body: "Any issue getting KASE slots for Saturday morning? Principal wants wheels-up by 08:30 from Scottsdale." },
      { from: "AMG Operations", hoursAgo: 70, body: "Slots requested — Saturday AM arrivals into Aspen are tight but we have a 10:15L confirmed and are holding a 09:40L on the waitlist. Crew is briefed either way." },
    ],
  },
];

export const DEMO_NOTIFICATIONS: DemoNotification[] = [
  { id: "dn-01", title: "AOG request submitted", body: "Blue Horizon Energy filed an AOG support request for N612BH at KELP.", hoursAgo: 5, tone: "danger", icon: "alert" },
  { id: "dn-02", title: "Quote approved", body: "Crestwood Health Group approved Q-1216 ($12,600) for AMG-2447.", hoursAgo: 9, tone: "success", icon: "receipt" },
  { id: "dn-03", title: "Payment received", body: "Meridian Capital Partners paid INV-2097 in full via ACH.", hoursAgo: 14, tone: "success", icon: "wallet" },
  { id: "dn-04", title: "Crew availability updated", body: "Sarah Mitchell blocked Aug 12–15 for recurrent training.", hoursAgo: 22, tone: "info", icon: "calendar" },
  { id: "dn-05", title: "Invoice overdue", body: "INV-2093 (Lakeshore Holdings, $24,600) is now 36 days past due.", hoursAgo: 30, tone: "warn", icon: "alert" },
  { id: "dn-06", title: "Document expiring", body: "Jenna Ruiz's first-class medical expires in 27 days.", hoursAgo: 47, tone: "warn", icon: "badgeCheck" },
  { id: "dn-07", title: "Mission completed", body: "AMG-2441 (KSDL → KLAS) closed out; two expenses awaiting review.", hoursAgo: 51, tone: "neutral", icon: "plane" },
  { id: "dn-08", title: "New subscription trial", body: "Ironwood Development started a Flight Support — Core trial.", hoursAgo: 96, tone: "info", icon: "creditCard" },
];

export const DEMO_TASKS: DemoTask[] = [
  { id: "dt-01", title: "Source starter-generator for N612BH (AOG)", priority: "urgent", dueInDays: 0 },
  { id: "dt-02", title: "Assign SIC for AMG-2446 Miami trip", priority: "high", dueInDays: 1 },
  { id: "dt-03", title: "Chase insurance approval — Lakeshore ferry crew", priority: "high", dueInDays: 2 },
  { id: "dt-04", title: "Collections call — INV-2093 (36 days past due)", priority: "normal", dueInDays: 3 },
  { id: "dt-05", title: "Confirm KASE slot for Sterling weekend trip", priority: "normal", dueInDays: 4 },
];

export const DEMO_ACTIVITY: DemoActivity[] = [
  { id: "da-01", action: "mission_created", detail: "AMG-2454 AOG support request received from Blue Horizon Energy", hoursAgo: 5 },
  { id: "da-02", action: "quote_approved", detail: "Q-1216 approved by Crestwood Health Group — $12,600", hoursAgo: 9 },
  { id: "da-03", action: "payment_recorded", detail: "ACH payment of $9,750 applied to INV-2097", hoursAgo: 14 },
  { id: "da-04", action: "crew_availability_updated", detail: "Sarah Mitchell marked Aug 12–15 unavailable (training)", hoursAgo: 22 },
  { id: "da-05", action: "invoice_sent", detail: "INV-2098 issued to Blue Horizon Energy — $41,200", hoursAgo: 28 },
  { id: "da-06", action: "mission_status_changed", detail: "AMG-2443 ferry KVNY → KTEB moved to In Progress", hoursAgo: 33 },
  { id: "da-07", action: "expense_submitted", detail: "Priya Nair submitted 2 expenses against AMG-2441", hoursAgo: 40 },
  { id: "da-08", action: "subscription_started", detail: "Ironwood Development began Flight Support — Core trial", hoursAgo: 96 },
];

/** ISO timestamp `days` from now (fractional days supported). */
export function demoDate(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString();
}

/** ISO timestamp `hours` ago. */
export function demoHoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 3_600_000).toISOString();
}

export const DEMO_MRR = DEMO_SUBSCRIPTIONS.filter((s) => s.status === "active").reduce(
  (sum, s) => sum + s.mrr,
  0
);

export const DEMO_AR_OUTSTANDING = DEMO_INVOICES.reduce((sum, i) => sum + i.amountDue, 0);

export const DEMO_AR_OVERDUE = DEMO_INVOICES.filter((i) => i.status === "overdue").reduce(
  (sum, i) => sum + i.amountDue,
  0
);
