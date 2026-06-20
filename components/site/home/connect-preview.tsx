import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { IMG } from "@/lib/site-media";
import { PortalScreenshotFrame } from "@/components/site/portal-screenshot-frame";
import { getWebsiteContentPage, imageSrcForKey } from "@/lib/website-editor/content";

const FEATURES = [
  "Support requests",
  "Aircraft profiles",
  "Crew review",
  "Documents",
  "Quotes & invoices",
  "Status updates",
];

export function ConnectPreview() {
  const content = getWebsiteContentPage("amg-connect");
  const section = content.sections.portalPreview;
  const screenshot = imageSrcForKey(section.imageKey) ?? IMG.portalClientDashboard;

  return (
    <section className="oc-panel-graphite oc-section relative isolate overflow-hidden text-[var(--oc-paper)]">
      <Image
        src={IMG.generatedConnectDashboard}
        alt=""
        fill
        sizes="100vw"
        className="absolute inset-0 -z-20 object-cover opacity-[0.2]"
      />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(7,19,33,0.98),rgba(7,19,33,0.88)_44%,rgba(7,19,33,0.96)),radial-gradient(circle_at_80%_28%,rgba(229,177,105,0.18),transparent_28rem)]" />
      <div className="oc-shell grid items-center gap-14 lg:grid-cols-[0.85fr_1.15fr]">
        <div data-scroll-animate>
          <p className="oc-eyebrow oc-eyebrow-light">{section.eyebrow ?? "AMG Connect"}</p>
          <h2 className="oc-display mt-4 text-4xl text-[var(--oc-paper)] sm:text-5xl">
            {section.headline ?? "The support picture, in one portal."}
          </h2>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-[var(--oc-aluminum)]">
            {section.body}
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
              {section.primaryCtaLabel ?? "Member Login"}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href={section.secondaryCtaHref ?? "/login?mode=request"} prefetch={false} className="oc-btn oc-btn-ghost-dark">
              {section.secondaryCtaLabel ?? "Request Access"}
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div data-scroll-animate className="group [perspective:1600px]">
          <PortalScreenshotFrame
            src={screenshot}
            alt="AMG client portal dashboard showing support requests and aircraft records"
            priority
            className="transition-transform duration-500 will-change-transform group-hover:[transform:rotateX(1.5deg)_rotateY(-2deg)] motion-reduce:transition-none motion-reduce:group-hover:[transform:none]"
          />
        </div>
      </div>
    </section>
  );
}
