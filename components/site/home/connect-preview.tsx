import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { getWebsiteContentPage } from "@/lib/website-editor/content";

const FEATURES = [
  "Support requests",
  "Aircraft profiles",
  "Crew review",
  "Documents",
  "Messages",
  "Quotes and invoices",
  "Status updates",
];

const MOCK_ROWS = [
  ["REQ-2041", "Crew coverage", "IN REVIEW"],
  ["REQ-2038", "Ferry / repositioning", "PROPOSAL SENT"],
  ["REQ-2035", "Maintenance movement", "SCHEDULED"],
  ["REQ-2031", "Recurring support", "ACTIVE"],
] as const;

export function ConnectPreview() {
  const content = getWebsiteContentPage("amg-connect");
  const section = content.sections.portalPreview;

  return (
    <section className="oc-section relative isolate overflow-hidden bg-[#070B14] text-[var(--oc-paper)]">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_80%_28%,rgba(0,232,135,0.1),transparent_28rem)]" />
      <div className="oc-shell grid items-center gap-14 lg:grid-cols-[0.85fr_1.15fr]">
        <div data-scroll-animate>
          <p className="oc-eyebrow oc-eyebrow-light">AMG Connect</p>
          <h2 className="oc-display mt-4 text-4xl text-[var(--oc-paper)] sm:text-5xl">
            Track requests, documents, quotes, invoices, and status in one portal.
          </h2>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-[var(--oc-aluminum)]">
            Owners, crew members, approved partners, and AMG administrators see information relevant to their role.
          </p>

          <ul className="mt-7 flex flex-wrap gap-2" data-stagger-container>
            {FEATURES.map((f) => (
              <li
                key={f}
                data-stagger-item
                className="oc-kicker rounded-full border border-[var(--oc-line-dark)] px-3 py-1.5 text-[0.62rem] text-[var(--oc-aluminum)]"
              >
                {f}
              </li>
            ))}
          </ul>

          <p className="mt-6 text-sm text-[var(--oc-aluminum-2)]">
            Role views — <span className="text-[var(--oc-paper)]">Owner</span> ·{" "}
            <span className="text-[var(--oc-paper)]">Crew</span> ·{" "}
            <span className="text-[var(--oc-paper)]">Admin</span>
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href={section.primaryCtaHref ?? "/login"} prefetch={false} className="oc-btn oc-btn-light">
              {section.primaryCtaLabel ?? "Member login"}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href={section.secondaryCtaHref ?? "/login?mode=request"} prefetch={false} className="oc-btn oc-btn-ghost-dark">
              Request Portal Access
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* stylized flight-deck console preview (illustrative, not a screenshot) */}
        <div data-scroll-animate className="hud-frame relative overflow-hidden border border-[var(--oc-line-dark)] bg-[#0A1322] p-6">
          <div className="mb-5 flex items-center justify-between border-b border-[var(--oc-line-dark)] pb-4">
            <span className="font-mono text-[10px] uppercase [letter-spacing:0.22em] text-[var(--instrument)]">
              AMG CONNECT // OPS VIEW
            </span>
            <span className="flex items-center gap-2">
              <span className="oc-dot" />
              <span className="font-mono text-[10px] uppercase [letter-spacing:0.22em] text-[var(--oc-aluminum-2)]">
                LINK ACTIVE
              </span>
            </span>
          </div>
          <div className="grid gap-2.5">
            {MOCK_ROWS.map(([id, kind, status]) => (
              <div
                key={id}
                className="flex items-center justify-between gap-4 border border-[var(--oc-line-dark)] bg-[#070B14]/70 px-4 py-3.5"
              >
                <span className="font-mono text-[11px] text-[var(--t3)]">{id}</span>
                <span className="flex-1 truncate text-sm text-[var(--oc-paper)]">{kind}</span>
                <span
                  className={`font-mono text-[10px] uppercase [letter-spacing:0.18em] ${
                    status === "SCHEDULED" || status === "ACTIVE"
                      ? "text-[var(--instrument)]"
                      : "text-[var(--amber)]"
                  }`}
                >
                  {status}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2.5">
            {["MESSAGES", "DOCUMENTS", "INVOICES"].map((label) => (
              <div key={label} className="border border-[var(--oc-line-dark)] bg-[#070B14]/50 px-3 py-2.5 text-center">
                <span className="font-mono text-[9px] uppercase [letter-spacing:0.2em] text-[var(--t3)]">{label}</span>
              </div>
            ))}
          </div>
          <p className="mt-5 text-right font-mono text-[9px] uppercase [letter-spacing:0.2em] text-[var(--t3)]">
            Illustrative preview — not live data
          </p>
        </div>
      </div>
    </section>
  );
}
