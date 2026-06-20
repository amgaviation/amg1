import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { IMG } from "@/lib/site-media";

export function OperationalClaritySection() {
  return (
    <section className="oc-section bg-[var(--oc-ivory)]">
      <div className="oc-shell grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div data-scroll-animate>
          <p className="oc-eyebrow">Operational Clarity</p>
          <h2 className="oc-display mt-4 text-4xl text-[var(--oc-ink)] sm:text-5xl lg:text-[3rem]">
            Clear support paths, not vague promises.
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-[var(--oc-muted)]">
            AMG's role is to keep mission movement, aircraft status, crew planning, maintenance timing, and support coordination legible to the people responsible for the operation.
          </p>
          <p className="mt-5 text-[0.96rem] leading-relaxed text-[var(--oc-muted)]">
            Support is reviewed before acceptance so expectations, limitations, timing, and operating responsibility are understood before coordination begins.
          </p>
          <div className="mt-8">
            <Link href="/capabilities" prefetch={false} className="oc-btn oc-btn-primary">
              How support is reviewed
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div
          data-scroll-animate
          className="relative h-[400px] overflow-hidden rounded-[1.5rem] border border-[var(--oc-line)] lg:h-[480px]"
        >
          <Image
            src={IMG.aboutOperations}
            alt="AMG operational coordination — aircraft status and support review"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
            style={{ objectPosition: "center 30%" }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--oc-navy)]/30 to-transparent" />

          {/* Overlay callout */}
          <div className="absolute bottom-5 left-5 right-5 rounded-xl border border-[var(--oc-line-dark)] bg-[var(--oc-navy)]/80 p-4 backdrop-blur-md">
            <p className="oc-kicker text-[0.62rem] text-[var(--oc-aluminum-2)]">AMG Operating Principle</p>
            <p className="mt-1.5 text-sm leading-relaxed text-[var(--oc-paper)]">
              A request is not treated as accepted simply because a form was submitted. AMG reviews the operational context before presenting a support path.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
