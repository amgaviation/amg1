import type { Metadata } from "next";
import { RequestFormSection } from "./request-form-section";
import { PhoneLink } from "@/components/site/tracked-link";
import { HeadlineReveal } from "@/components/site/headline-reveal";

export const metadata: Metadata = {
  title: "Request a Quote — Written Answer in 24 Business Hours",
  description:
    "One form, five minutes: aircraft, mission, dates, insurance carrier. A named coordinator replies with a written, itemized quote within 24 business hours.",
};

// success/error are read client-side inside RequestFormSection (useSearchParams),
// so this page prerenders statically instead of going dynamic per request.
export default function RequestPage() {
  return (
    <>
      <section className="pub-hero oc-shell pb-14 pt-[calc(var(--public-header-height)+4rem)]">
        <div className="max-w-3xl" data-stagger-container>
          <p className="oc-eyebrow" data-stagger-item>
            Request intake // 5 minutes
          </p>
          <HeadlineReveal
            className="oc-display mt-4 text-5xl text-[var(--oc-paper)] sm:text-6xl"
            lines={["Five minutes now.", "A written quote in 24 hours."]}
          />
          <p className="mt-6 text-lg leading-relaxed text-[var(--oc-aluminum)]" data-stagger-item>
            No phone tag. Submit the mission and a named coordinator replies with pilot options,
            qualifications, and an itemized all-in cost. Prefer to talk?{" "}
            <PhoneLink source="request_page" className="oc-mono text-[var(--oc-paper)] underline-offset-2 hover:underline" />
          </p>
        </div>
      </section>

      <section className="oc-section">
        <div className="oc-shell max-w-3xl">
          <RequestFormSection />
        </div>
      </section>
    </>
  );
}
