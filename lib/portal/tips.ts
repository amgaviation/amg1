/**
 * Contextual help content for the portal — route-keyed, longest-prefix
 * matched. Pure data: the header Help menu lists every tip for the current
 * page, and the idle coach surfaces one at a time after a quiet period.
 * Keep tips factual — they describe features that exist today.
 */

export type PortalTip = {
  title: string;
  body: string;
};

type TipEntry = { prefix: string; tips: PortalTip[] };

const GENERAL_TIPS: PortalTip[] = [
  {
    title: "Notifications live in the bell",
    body: "The bell in the top bar shows unread activity. Profile and settings are under your avatar.",
  },
  {
    title: "Your work is saved on the server",
    body: "Status changes and submissions confirm with a green notice. If something fails, the page tells you why — your typed input stays put.",
  },
];

const TIP_REGISTRY: TipEntry[] = [
  {
    prefix: "/portal/admin/dashboard",
    tips: [
      {
        title: "Work the queue top-down",
        body: "Needs Action Now is ranked: AOG first, then SLA risk, imminent departures, and review queues. Each row links straight to the record.",
      },
      {
        title: "Statistics moved to Business",
        body: "Revenue, pipeline, and receivables summaries live in the Business workspace — the Command Center only shows what needs a decision.",
      },
    ],
  },
  {
    prefix: "/portal/admin/mission-control",
    tips: [
      {
        title: "Cards offer the legal next step",
        body: "Each card shows this request's next move in the lifecycle. Open the record for every legal move, gate details, and the audited override.",
      },
      {
        title: "Filters live in the URL",
        body: "The stage selector and list filters are links — browser back/forward and bookmarks keep your exact view.",
      },
    ],
  },
  {
    prefix: "/portal/admin/trips",
    tips: [
      {
        title: "One record, three views",
        body: "Support Requests, Mission Control, and the Calendar are views of the same records — switch in the Operations menu without losing your place.",
      },
      {
        title: "Gates are enforced on the server",
        body: "Insurance and closeout gates block a move until resolved, or until an admin records an override reason — every override is audited and broadcast.",
      },
    ],
  },
  {
    prefix: "/portal/admin/business",
    tips: [
      {
        title: "Follow the money left to right",
        body: "Sell (pipeline, quotes) → Collect (invoices, receivables) → Spend & Analyze (expenses, payouts, analytics). Each tile opens the working list.",
      },
    ],
  },
  {
    prefix: "/portal/admin/network",
    tips: [
      {
        title: "Readiness beats headcount",
        body: "Credential alerts and open applications are the numbers that matter here — a crew member with an expired credential can't be assigned without an override.",
      },
    ],
  },
  {
    prefix: "/portal/admin/user-approvals",
    tips: [
      {
        title: "Approvals create real access",
        body: "Approving an account sends a branded setup email and unlocks the requested role's workspace. Waitlist keeps a prospect warm without granting access.",
      },
    ],
  },
  {
    prefix: "/portal/client/dashboard",
    tips: [
      {
        title: "Start with Needs Your Action",
        body: "Information requests, quotes to review, and balances due appear at the top of Home — everything else is status.",
      },
      {
        title: "New Support Request is always one tap",
        body: "The blue button in the sidebar (and the + on mobile) starts a request from anywhere in the portal.",
      },
    ],
  },
  {
    prefix: "/portal/client/trips",
    tips: [
      {
        title: "Track a request on its page",
        body: "Open any request to see its status timeline, respond to information requests, and reach related quotes, messages, and documents.",
      },
    ],
  },
  {
    prefix: "/portal/crew/missions",
    tips: [
      {
        title: "Offers need a response",
        body: "Accept or decline from the assignment page — compliance checks run automatically when you accept.",
      },
      {
        title: "The Open Pool is qualification-matched",
        body: "Keep certificates, ratings, hours, and date of birth current in your profile — pool missions only appear when you qualify.",
      },
    ],
  },
  {
    prefix: "/portal/crew/credentials",
    tips: [
      {
        title: "Expirations gate assignments",
        body: "An expired credential blocks new assignments until it's renewed and re-approved. Upload replacements before the expiry date.",
      },
    ],
  },
  {
    prefix: "/portal/crew/expenses",
    tips: [
      {
        title: "Receipts speed up reimbursement",
        body: "Attach the receipt when you submit — approved expenses flow into invoicing and the payout process.",
      },
    ],
  },
  {
    prefix: "/portal/partner/requests",
    tips: [
      {
        title: "Respond, quote, then update milestones",
        body: "Accept or decline first, submit your quote, then keep the milestone status current so AMG Operations can coordinate around your work.",
      },
    ],
  },
];

/** Tips for a path: longest matching prefix first, then general fallbacks. */
export function tipsForPath(pathname: string): PortalTip[] {
  const matches = TIP_REGISTRY
    .filter((entry) => pathname === entry.prefix || pathname.startsWith(`${entry.prefix}/`) || pathname.startsWith(`${entry.prefix}?`))
    .sort((a, b) => b.prefix.length - a.prefix.length);
  const collected = matches.flatMap((entry) => entry.tips);
  return collected.length > 0 ? [...collected, ...GENERAL_TIPS] : GENERAL_TIPS;
}
