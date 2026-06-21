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
  "Messages",
  "Quotes and invoices",
  "Status updates",
];

export function ConnectPreview() {
  const content = getWebsiteContentPage("amg-connect");
  const section = content.sections.portalPreview;
  const screenshot = imageSrcForKey(section.imageKey) ?? IMG.portalClientDashboard;

  return (
    <section className="relative isolate overflow-hidden bg-[#000000] py-24 lg:py-32">
      {/* Subtle background image */}
      <Image
        src={IMG.generatedConnectDashboard}
        alt=""
        fill
        sizes="100vw"
        className="absolute inset-0 -z-20 object-cover opacity-[0.06]"
      />
      {/* Deep black overlay */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(0,0,0,0.97),rgba(0,0,0,0.88)_44%,rgba(0,0,0,0.96)),radial-gradient(circle_at_80%_28%,rgba(59,130,246,0.07),transparent_28rem)]" />

      <div className="oc-shell grid items-center gap-14 lg:grid-cols-[0.85fr_1.15fr]">
        {/* Left — copy */}
        <div data-scroll-animate>
          <p className="mb-5 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-white/30">
            AMG Connect
          </p>
          <h2 className="text-balance text-4xl font-bold leading-[0.9] tracking-tight text-white sm:text-5xl">
            Track requests, documents, quotes, invoices, and status in one portal.
          </h2>
          <p className="mt-5 max-w-md text-[0.9rem] leading-relaxed text-white/45">
            Owners, crew members, approved partners, and AMG administrators see information relevant to their role.
          </p>

          {/* Feature tags */}
          <ul className="mt-7 flex flex-wrap gap-2" data-stagger-container>
            {FEATURES.map((f) => (
              <li
                key={f}
                data-stagger-item
                className="rounded-full border border-white/[0.07] bg-white/[0.03] px-3 py-1.5 text-[0.62rem] font-semibold uppercase tracking-widest text-white/30"
              >
                {f}
              </li>
            ))}
          </ul>

          <p className="mt-5 text-[0.78rem] text-white/30">
            Role views —{" "}
            <span className="text-white/60">Owner</span>{" · "}
            <span className="text-white/60">Crew</span>{" · "}
            <span className="text-white/60">Admin</span>
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href={section.primaryCtaHref ?? "/login"}
              prefetch={false}
              className="inline-flex items-center gap-2 rounded-full border border-white bg-white px-5 py-2.5 text-[0.72rem] font-semibold uppercase tracking-widest text-black transition-all duration-200 hover:bg-white/88 hover:shadow-[0_0_28px_rgba(255,255,255,0.15)]"
            >
              {section.primaryCtaLabel ?? "Member Login"}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href={section.secondaryCtaHref ?? "/login?mode=request"}
              prefetch={false}
              className="inline-flex items-center gap-2 rounded-full border border-white/[0.1] px-5 py-2.5 text-[0.72rem] font-semibold uppercase tracking-widest text-white/50 transition-all duration-200 hover:border-white/[0.2] hover:text-white/90"
            >
              Request Portal Access
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Right — screenshot */}
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
