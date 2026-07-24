"use client";

import { useFormStatus } from "react-dom";

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
      className="intake-form oc-card-dark grid gap-5 p-6 sm:p-8"
    >
      {/* Channel annunciator: CSS-only — :focus-within flips STANDBY to
          CHANNEL OPEN while any field has focus. Decorative echo of the
          fieldwork below, so hidden from AT. */}
      <div
        className="-mx-6 -mt-6 flex items-center justify-between gap-4 border-b border-[rgba(169,180,198,0.14)] px-6 py-3.5 sm:-mx-8 sm:-mt-8 sm:px-8"
        aria-hidden="true"
      >
        <span className="microlabel">Request intake // R-01</span>
        <span className="intake-idle flex items-center gap-2 font-mono text-[10px] uppercase [letter-spacing:0.2em] text-[var(--oc-aluminum-2)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[rgba(169,180,198,0.45)]" />
          Standby
        </span>
        <span className="intake-live flex items-center gap-2 font-mono text-[10px] uppercase [letter-spacing:0.2em] text-[var(--instrument-ink)]">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--instrument)] shadow-[0_0_8px_rgba(48,138,255,0.9)]" />
          Channel open
        </span>
      </div>
      <style>{`
        .intake-form {
          transition: border-color 0.35s ease, box-shadow 0.35s ease;
        }
        .intake-form .intake-live {
          display: none;
        }
        .intake-form:focus-within {
          border-color: rgba(48, 138, 255, 0.45);
          box-shadow: 0 0 60px rgba(11, 94, 212, 0.14), 0 24px 70px rgba(0, 0, 0, 0.26);
        }
        .intake-form:focus-within .intake-idle {
          display: none;
        }
        .intake-form:focus-within .intake-live {
          display: inline-flex;
        }
        @media (prefers-reduced-motion: reduce) {
          .intake-form {
            transition: none;
          }
          .intake-form .intake-live .animate-pulse {
            animation: none;
          }
        }
      `}</style>
      {error ? (
        <p
          role="alert"
          className="rounded-lg border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200"
        >
          {error === "missing"
            ? "A required field is missing — please check the form and resubmit."
            : error === "payment-data"
              ? "Please remove card or bank account numbers from the notes; we never take payment data through this form."
              : error === "rate-limited"
                ? "Too many requests from your connection. Please wait a few minutes and try again, or call the number in the footer."
                : "Something went wrong saving your request. Please try again, or call the number in the footer."}
        </p>
      ) : null}

      <input id="quote-ops-ref" name="ops_ref_code" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

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
        <Field label="Company or flight department" hint="Optional">
          <input name="company" autoComplete="organization" className={inputClass} />
        </Field>
        <Field label="Aircraft type" hint="Make and model — e.g. SR22, PC-12, King Air 250">
          <input name="aircraft_type" required className={inputClass} />
        </Field>
        <Field label="Tail number" hint="If you'd rather share it by phone, leave blank">
          <input name="tail_number" className={inputClass} />
        </Field>
        <Field label="What support do you need?">
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
        <Field label="Insurance broker contact" hint="Name or email — speeds up pilot approval on your policy">
          <input name="insurance_broker" className={inputClass} />
        </Field>
        <Field label="Origin" hint="If known">
          <input name="origin" className={inputClass} placeholder="e.g. KTPA" />
        </Field>
        <Field label="Destination" hint="If known">
          <input name="destination" className={inputClass} placeholder="e.g. KPDK" />
        </Field>
      </div>

      <Field label="What happened?" hint="Include timing, any insurance or mentor-pilot requirement, and what you need help coordinating.">
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
          I understand this is a request for review, not confirmed service, a crew assignment, aircraft movement, or an operational commitment, and that the terms in{" "}
          <Link href="/legal" prefetch={false} className="underline underline-offset-2">
            Legal
          </Link>{" "}
          apply.
        </span>
      </label>

      <div>
        <SubmitQuoteButton />
      </div>
    </form>
  );
}

function SubmitQuoteButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="oc-btn oc-btn-light disabled:cursor-not-allowed disabled:opacity-60">
      {pending ? "Sending…" : "Submit Request"}
      <ArrowRight className="h-4 w-4" />
    </button>
  );
}
