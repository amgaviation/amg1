"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { submitQuoteRequest } from "./actions";
import { trackSiteEvent } from "@/lib/site-analytics";
import { MISSION_TYPES, SITE_EVENTS } from "@/lib/site-config";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="font-semibold text-[var(--oc-paper)]">{label}</span>
      {children}
      {hint ? <span className="text-xs text-[var(--oc-aluminum-2)]">{hint}</span> : null}
    </label>
  );
}

const inputClass = "support-field w-full px-3.5 py-2.5 text-base";

export function QuoteRequestForm({ error }: { error?: string }) {
  return (
    <form
      action={submitQuoteRequest}
      onSubmit={() => trackSiteEvent(SITE_EVENTS.quoteFormSubmit)}
      className="oc-card-dark grid gap-5 p-6 sm:p-8"
    >
      {error ? (
        <p
          role="alert"
          className="rounded-lg border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200"
        >
          {error === "missing"
            ? "A required field is missing — please check the form and resubmit."
            : error === "payment-data"
              ? "Please remove card or bank account numbers from the notes; we never take payment data through this form."
              : "Something went wrong saving your request. Please try again, or call the number in the footer."}
        </p>
      ) : null}

      <input id="quote-website" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Name">
          <input name="name" required autoComplete="name" className={inputClass} />
        </Field>
        <Field label="Email">
          <input name="email" type="email" required autoComplete="email" className={inputClass} />
        </Field>
        <Field label="Phone">
          <input name="phone" type="tel" required autoComplete="tel" className={inputClass} />
        </Field>
        <Field label="Aircraft type" hint="Make and model — e.g. SR22, PC-12, King Air 250">
          <input name="aircraft_type" required className={inputClass} />
        </Field>
        <Field label="Tail number" hint="If you'd rather share it by phone, leave blank">
          <input name="tail_number" className={inputClass} />
        </Field>
        <Field label="Mission type">
          <select name="support_type" required className={inputClass} defaultValue="">
            <option value="" disabled>
              Select…
            </option>
            {MISSION_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Dates" hint="Exact or approximate — e.g. 'week of Aug 10'">
          <input name="requested_dates" required className={inputClass} />
        </Field>
        <Field label="Insurance carrier" hint="If unknown now, we'll collect it before crew confirmation">
          <input name="insurance_carrier" className={inputClass} />
        </Field>
        <Field label="Origin" hint="If known">
          <input name="origin" className={inputClass} placeholder="e.g. KTPA" />
        </Field>
        <Field label="Destination" hint="If known">
          <input name="destination" className={inputClass} placeholder="e.g. KPDK" />
        </Field>
      </div>

      <Field label="Anything else">
        <textarea name="additional_notes" rows={4} className={`${inputClass} min-h-28`} />
      </Field>

      <label className="flex items-start gap-3 text-sm text-[var(--oc-aluminum)]">
        <input
          name="acknowledgment"
          value="accepted"
          type="checkbox"
          required
          className="mt-1 h-4 w-4 accent-[var(--oc-blue)]"
        />
        <span>
          I understand AMG will reply with a written, itemized quote and that the terms in{" "}
          <Link href="/legal" prefetch={false} className="underline underline-offset-2">
            Legal
          </Link>{" "}
          apply.
        </span>
      </label>

      <div>
        <button type="submit" className="oc-btn oc-btn-light">
          Request a Quote
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}
