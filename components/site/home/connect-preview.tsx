import Link from "next/link";
import { ArrowRight, ArrowUpRight, FileText, LayoutDashboard, Plane, Receipt, Users } from "lucide-react";

const FEATURES = [
  "Mission requests",
  "Aircraft profiles",
  "Crew assignments",
  "Documents",
  "Quotes & invoices",
  "Status updates",
];

const NAV = [
  { label: "Requests", icon: LayoutDashboard, active: true },
  { label: "Aircraft", icon: Plane, active: false },
  { label: "Crew", icon: Users, active: false },
  { label: "Documents", icon: FileText, active: false },
  { label: "Invoices", icon: Receipt, active: false },
];

const REQUESTS = [
  { ref: "AMG-2287", route: "KTEB → KMIA", state: "Reviewing", tone: "amber" },
  { ref: "AMG-2284", route: "KVNY → KSDL", state: "Crew matched", tone: "blue" },
  { ref: "AMG-2280", route: "KHPN → KPBI", state: "Updated", tone: "green" },
];

const toneClass: Record<string, string> = {
  amber: "border-amber-300/30 text-amber-200",
  blue: "border-[var(--oc-blue-soft)]/40 text-[var(--oc-blue-soft)]",
  green: "border-emerald-300/30 text-emerald-200",
};

export function ConnectPreview() {
  return (
    <section className="oc-panel-graphite oc-section relative overflow-hidden text-[var(--oc-paper)]">
      <div className="oc-shell grid items-center gap-14 lg:grid-cols-[0.85fr_1.15fr]">
        <div data-scroll-animate>
          <p className="oc-eyebrow oc-eyebrow-light">AMG Connect</p>
          <h2 className="oc-display mt-4 text-4xl text-[var(--oc-paper)] sm:text-5xl">
            The operations picture, in one portal.
          </h2>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-[var(--oc-aluminum)]">
            AMG Connect gives owners, crews, and administrators a role-based view of requests, aircraft, documents, and
            status — so everyone works from the same source of truth.
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
            <Link href="/login" prefetch={false} className="oc-btn oc-btn-light">
              Member Login
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/login?mode=request" prefetch={false} className="oc-btn oc-btn-ghost-dark">
              Request Access
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* portal mock */}
        <div data-scroll-animate className="group [perspective:1600px]">
          <div className="oc-card-dark overflow-hidden shadow-[var(--oc-shadow)] transition-transform duration-500 will-change-transform group-hover:[transform:rotateX(1.5deg)_rotateY(-2deg)] motion-reduce:transition-none motion-reduce:group-hover:[transform:none]">
            {/* window chrome */}
            <div className="flex items-center gap-2 border-b border-[var(--oc-line-dark)] px-5 py-3.5">
              <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
              <span className="oc-mono ml-3 text-xs text-[var(--oc-aluminum-2)]">amgconnect.app / client</span>
              <span className="oc-dot oc-dot-live ml-auto h-1.5 w-1.5" aria-hidden="true" />
            </div>

            <div className="grid grid-cols-[auto_1fr] gap-0">
              {/* sidebar */}
              <div className="hidden flex-col gap-1 border-r border-[var(--oc-line-dark)] p-4 sm:flex">
                {NAV.map((item) => (
                  <span
                    key={item.label}
                    className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm ${
                      item.active ? "bg-white/8 text-[var(--oc-paper)]" : "text-[var(--oc-aluminum-2)]"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </span>
                ))}
              </div>

              {/* main */}
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <p className="oc-kicker text-[var(--oc-aluminum)]">Mission requests</p>
                  <span className="oc-mono text-xs text-[var(--oc-aluminum-2)]">3 open</span>
                </div>
                <div className="mt-3 grid gap-2.5">
                  {REQUESTS.map((r) => (
                    <div
                      key={r.ref}
                      className="flex items-center justify-between gap-3 rounded-xl border border-[var(--oc-line-dark)] bg-white/[0.03] px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="oc-mono text-xs text-[var(--oc-aluminum-2)]">{r.ref}</p>
                        <p className="truncate text-sm text-[var(--oc-paper)]">{r.route}</p>
                      </div>
                      <span className={`oc-kicker shrink-0 rounded-full border px-2.5 py-1 text-[0.58rem] ${toneClass[r.tone]}`}>
                        {r.state}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                  <div className="rounded-xl border border-[var(--oc-line-dark)] bg-white/[0.03] p-4">
                    <p className="oc-kicker text-[var(--oc-aluminum-2)]">Aircraft profile</p>
                    <p className="mt-2 text-sm text-[var(--oc-paper)]">Midsize · two-crew</p>
                    <p className="mt-1 text-xs text-[var(--oc-aluminum-2)]">Status — Airworthy</p>
                  </div>
                  <div className="rounded-xl border border-[var(--oc-line-dark)] bg-white/[0.03] p-4">
                    <p className="oc-kicker text-[var(--oc-aluminum-2)]">Quote / invoice</p>
                    <p className="mt-2 text-sm text-[var(--oc-paper)]">Draft proposal</p>
                    <p className="mt-1 text-xs text-[var(--oc-aluminum-2)]">Awaiting review</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
