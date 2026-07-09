import type { Metadata } from "next";
import Link from "next/link";
import { LegalDocumentPage } from "@/components/compliance/legal-document-page";
import { submitPrivacyChoicesRequest } from "@/app/(public)/privacy-choices/actions";
import { getUserFacingErrorMessage } from "@/lib/errors/user-facing-errors";
import { SITE } from "@/lib/site-config";

const CANONICAL_BASE = process.env.NEXT_PUBLIC_APP_URL || SITE.url;

// This document is also served at /legal/privacy-choices. This standalone route
// (which carries the data-rights request form) is the canonical one; the /legal
// counterpart points here.
export const metadata: Metadata = {
  title: "AMG Aviation Group - Privacy Choices",
  description: "Submit privacy, data rights, marketing opt-out, SMS opt-out, and cookie preference requests.",
  alternates: { canonical: `${CANONICAL_BASE}/privacy-choices` },
};

export default async function PrivacyChoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string; ref?: string }>;
}) {
  const params = await searchParams;

  return (
    <>
      <LegalDocumentPage slug="privacy-choices" />
      <section className="border-t border-white/[0.10] bg-[#050B14] px-6 py-20 lg:px-10">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-lg border border-white/[0.10] bg-[#07111F]/92 p-6 text-white shadow-[0_18px_58px_rgba(0,0,0,0.24)]">
            <p className="eyebrow text-accent">Privacy Request</p>
            <h2 className="mt-3 font-display text-3xl font-bold uppercase text-white">Submit a data rights request</h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--amg-text-secondary)]">
              AMG may need to verify your identity or authority before acting on the request.
            </p>
            {params.success === "received" ? (
              <div role="status" className="mt-5 rounded-lg border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-emerald-100">
                Request received. AMG will review and respond through the contact information provided.
              </div>
            ) : null}
            {params.error ? (
              <div role="alert" className="mt-5 rounded-lg border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-100">
                {params.error === "missing"
                  ? "Complete the required fields and acknowledgment before submitting."
                  : params.error === "rate_limited"
                    ? "Too many requests from your connection. Please wait a few minutes and try again."
                    : getUserFacingErrorMessage({ area: "privacy_choices", action: "submit", correlationId: params.ref })}
              </div>
            ) : null}
            <form action={submitPrivacyChoicesRequest} className="mt-6 grid gap-5">
              <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-white">Full Name *</span>
                  <input name="full_name" required autoComplete="name" className="min-h-11 rounded-lg border border-white/[0.14] bg-[#050B14]/74 px-3 text-sm text-white outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(59,130,246,0.18)]" />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-white">Email *</span>
                  <input name="email" type="email" required autoComplete="email" className="min-h-11 rounded-lg border border-white/[0.14] bg-[#050B14]/74 px-3 text-sm text-white outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(59,130,246,0.18)]" />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-white">Phone</span>
                  <input name="phone" type="tel" autoComplete="tel" className="min-h-11 rounded-lg border border-white/[0.14] bg-[#050B14]/74 px-3 text-sm text-white outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(59,130,246,0.18)]" />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-white">Relationship to AMG</span>
                  <select name="relationship" className="min-h-11 rounded-lg border border-white/[0.14] bg-[#050B14]/74 px-3 text-sm text-white outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(59,130,246,0.18)]">
                    <option value="">Select one</option>
                    <option value="website_visitor">Website visitor</option>
                    <option value="client">Client or owner representative</option>
                    <option value="crew">Crew or pilot network</option>
                    <option value="vendor">Vendor or service partner</option>
                    <option value="other">Other</option>
                  </select>
                </label>
                <label className="grid gap-2 sm:col-span-2">
                  <span className="text-sm font-semibold text-white">Request Type *</span>
                  <select name="request_type" required className="min-h-11 rounded-lg border border-white/[0.14] bg-[#050B14]/74 px-3 text-sm text-white outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(59,130,246,0.18)]">
                    <option value="">Select one</option>
                    <option value="access">Access</option>
                    <option value="correction">Correction</option>
                    <option value="deletion">Deletion</option>
                    <option value="portability">Portability</option>
                    <option value="restriction">Restriction</option>
                    <option value="objection">Objection</option>
                    <option value="marketing_opt_out">Marketing opt-out</option>
                    <option value="sms_opt_out">SMS opt-out</option>
                    <option value="cookie_preferences">Cookie preferences</option>
                    <option value="other">Other</option>
                  </select>
                </label>
                <label className="grid gap-2 sm:col-span-2">
                  <span className="text-sm font-semibold text-white">Request Details</span>
                  <textarea name="details" className="min-h-32 rounded-lg border border-white/[0.14] bg-[#050B14]/74 px-3 py-2 text-sm text-white outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(59,130,246,0.18)]" />
                </label>
              </div>
              <label className="flex items-start gap-3 rounded-lg border border-white/[0.10] bg-white/[0.045] p-4 text-sm leading-relaxed text-[var(--amg-text-secondary)]">
                <input name="acknowledgement" value="accepted" type="checkbox" required className="mt-1 h-4 w-4 accent-[var(--oc-blue)]" />
                <span>
                  I understand AMG may verify this request and may respond through the contact information provided. Review the <Link href="/privacy-policy" className="text-accent hover:underline">Privacy Policy</Link>.
                </span>
              </label>
              <button type="submit" className="min-h-11 rounded-full border border-[var(--instrument)] bg-[var(--instrument)] px-5 text-sm font-semibold text-white hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--amg-accent-blue)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#07111F]">
                Submit Request
              </button>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
