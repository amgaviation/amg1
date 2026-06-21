"use client";

import { useState } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { ArrowRight, CheckCircle2, Send } from "lucide-react";
import { submitSupportRequest } from "@/app/(public)/contact/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { SafeErrorMessage } from "@/components/ui/safe-error-message";
import {
  aircraftCategories,
  aircraftStatuses,
  conditionalSupportFields,
  ownerApprovalStatuses,
  preferredContactMethods,
  requesterRoles,
  supportPaths,
  timelineOptions,
  type ConditionalField,
} from "@/lib/public-form-options";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="min-h-11 rounded-full bg-[var(--oc-blue)] px-6 text-white hover:bg-[var(--oc-navy)]">
      {pending ? "Sending..." : "Submit for Review"}
      <Send className="h-4 w-4" />
    </Button>
  );
}

function Field({
  label,
  children,
  required,
  className,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  className?: string;
}) {
  return (
    <label className={`grid gap-2 ${className ?? ""}`}>
      <span className="text-sm font-semibold text-[var(--oc-ink)]">
        {label}
        {required ? <span className="text-[var(--oc-blue)]">*</span> : null}
      </span>
      {children}
    </label>
  );
}

function NativeSelect({
  name,
  options,
  required,
  value,
  onChange,
}: {
  name: string;
  options: readonly { value: string; label: string }[];
  required?: boolean;
  value?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <select
      name={name}
      required={required}
      value={value}
      onChange={(event) => onChange?.(event.target.value)}
      className="support-field min-h-11 bg-white/80 px-3 text-sm"
    >
      <option value="" disabled>Select one</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
    </select>
  );
}

function ConditionalInput({ field }: { field: ConditionalField }) {
  return (
    <Field label={field.label} required={field.required}>
      {field.type === "textarea" ? (
        <Textarea name={field.name} required={field.required} placeholder={field.placeholder} className="min-h-28 bg-white/80" />
      ) : field.type === "select" && field.options ? (
        <NativeSelect name={field.name} options={field.options} required={field.required} />
      ) : (
        <Input name={field.name} type={field.type ?? "text"} required={field.required} placeholder={field.placeholder} className="min-h-11 bg-white/80" />
      )}
    </Field>
  );
}

function Section({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[var(--oc-line)] bg-[var(--oc-ivory)]/70 p-5">
      <p className="oc-eyebrow text-[0.68rem] text-[var(--oc-blue)]">{eyebrow}</p>
      <h2 className="mt-2 text-lg font-semibold text-[var(--oc-ink)]">{title}</h2>
      <div className="mt-5 grid gap-5 md:grid-cols-2">{children}</div>
    </section>
  );
}

export function SupportRequestForm({
  success,
  error,
  initialSupportPath,
}: {
  success?: string;
  error?: string;
  initialSupportPath?: string;
}) {
  const defaultPath = supportPaths.find((path) => path.value === initialSupportPath)?.value ?? "Aircraft Management Support";
  const [supportPath, setSupportPath] = useState(defaultPath);
  const conditionalFields = conditionalSupportFields[supportPath] ?? [];

  return (
    <Card className="oc-card rounded-2xl border-[var(--oc-line)] p-0">
      <CardContent className="p-5 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="oc-eyebrow text-[var(--oc-blue)]">Operational Intake</p>
            <h2 className="oc-display mt-3 text-3xl text-[var(--oc-ink)] sm:text-4xl">Submit operating details for review</h2>
          </div>
          <Badge variant="outline" className="border-[var(--oc-line)] bg-white/70 text-[var(--oc-ink)]">
            Source: Start a Support Request
          </Badge>
        </div>

        {success ? (
          <div role="status" className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm leading-relaxed text-emerald-900">
            <div className="flex gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Request received. AMG will check the aircraft, timing, crew fit, owner/operator approval, airports, weather, and required next steps before confirming what can proceed.
              </span>
            </div>
          </div>
        ) : null}
        {error ? (
          error === "missing" ? (
            <div role="alert" className="mt-6 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm leading-relaxed text-red-900">
              Complete the required fields and confirm the acknowledgment before submitting.
            </div>
          ) : error === "payment-data" ? (
            <div role="alert" className="mt-6 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm leading-relaxed text-red-900">
              Remove full card numbers, CVV codes, bank account numbers, or routing numbers before submitting. AMG does not process payment card or bank account payments through this website or portal.
            </div>
          ) : (
            <SafeErrorMessage area="request_support" action="submit" className="mt-6 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm leading-relaxed text-red-900" />
          )
        ) : null}

        <div className="mt-6 rounded-2xl border border-[var(--oc-line)] bg-white/75 p-5">
          <h3 className="text-lg font-semibold text-[var(--oc-ink)]">What happens after you submit</h3>
          <ol className="mt-3 grid gap-2 text-sm leading-relaxed text-[var(--oc-muted)] sm:grid-cols-2">
            <li>1. AMG reviews the aircraft, timing, location, and requested support.</li>
            <li>2. AMG may contact you for missing operating details.</li>
            <li>3. You receive a defined next step, scope, quote, or plan-review request.</li>
            <li>4. Support proceeds only after the applicable review and approval.</li>
          </ol>
        </div>

        <form action={submitSupportRequest} className="mt-7 grid gap-6 text-[var(--oc-ink)]">
          <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
          <Section eyebrow="Section 1" title="Requester Information">
            <Field label="Full Name" required>
              <Input name="full_name" required autoComplete="name" className="min-h-11 bg-white/80" />
            </Field>
            <Field label="Email" required>
              <Input name="email" type="email" required autoComplete="email" className="min-h-11 bg-white/80" />
            </Field>
            <Field label="Phone" required>
              <Input name="phone" type="tel" required autoComplete="tel" className="min-h-11 bg-white/80" />
            </Field>
            <Field label="Company / Operator" required>
              <Input name="company_operator" required autoComplete="organization" className="min-h-11 bg-white/80" />
            </Field>
            <Field label="Requester Role" required>
              <NativeSelect name="requester_role" options={requesterRoles} required />
            </Field>
            <Field label="Preferred Contact Method" required>
              <NativeSelect name="preferred_contact_method" options={preferredContactMethods} required />
            </Field>
          </Section>

          <Section eyebrow="Section 2" title="Aircraft Information">
            <Field label="Aircraft Category" required>
              <NativeSelect name="aircraft_category" options={aircraftCategories} required />
            </Field>
            <Field label="Aircraft Type" required>
              <Input name="aircraft_type" required placeholder="Citation M2, Phenom 300, Challenger 350, SR22, etc." className="min-h-11 bg-white/80" />
            </Field>
            <Field label="Tail Number">
              <Input name="tail_number" placeholder="N123AB" className="min-h-11 bg-white/80 uppercase" />
            </Field>
            <Field label="Home Airport / Base" required>
              <Input name="home_airport" required placeholder="KPMP, KFXE, KTEB, etc." className="min-h-11 bg-white/80 uppercase" />
            </Field>
            <Field label="Current Aircraft Location, if known">
              <Input name="current_aircraft_location" className="min-h-11 bg-white/80" />
            </Field>
            <Field label="Aircraft Status" required>
              <NativeSelect name="aircraft_status" options={aircraftStatuses} required />
            </Field>
          </Section>

          <section className="rounded-2xl border border-[var(--oc-line)] bg-[var(--oc-ivory)]/70 p-5">
            <p className="oc-eyebrow text-[0.68rem] text-[var(--oc-blue)]">Section 3</p>
            <h2 className="mt-2 text-lg font-semibold text-[var(--oc-ink)]">Support Category</h2>
            <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {supportPaths.map((path) => (
                <button
                  key={path.value}
                  type="button"
                  onClick={() => setSupportPath(path.value)}
                  aria-pressed={supportPath === path.value}
                  className={`min-h-11 rounded-xl border px-4 py-3 text-left text-sm font-semibold transition-colors ${
                    supportPath === path.value
                      ? "border-[var(--oc-blue)] bg-[var(--oc-blue)] text-white shadow-[0_12px_28px_rgba(59,130,246,0.22)]"
                      : "border-[var(--oc-line)] bg-white/70 text-[var(--oc-ink)] hover:border-[var(--oc-blue)]"
                  }`}
                >
                  {path.label}
                </button>
              ))}
            </div>
            <input type="hidden" name="support_path" value={supportPath} />
          </section>

          <Section eyebrow="Section 4" title="Support Details">
            <Field label="Requested support and operating context" required className="md:col-span-2">
              <Textarea name="requested_support_summary" required className="min-h-32 bg-white/80" />
            </Field>
            <p className="rounded-xl border border-[var(--oc-line)] bg-white/70 p-4 text-sm leading-relaxed text-[var(--oc-muted)] md:col-span-2">
              Do not enter full credit card numbers, CVV codes, bank account numbers, or routing numbers. AMG does not
              process payment card or bank account payments through this website or portal.
            </p>
            {conditionalFields.map((field) => (
              <ConditionalInput key={`${supportPath}-${field.name}`} field={field} />
            ))}
          </Section>

          <Section eyebrow="Section 5" title="Timing / Operational Context">
            <Field label="Desired Start Date">
              <Input name="desired_start_date" type="date" className="min-h-11 bg-white/80" />
            </Field>
            <Field label="Desired Completion Date or Timeline">
              <Input name="desired_completion_timeline" className="min-h-11 bg-white/80" />
            </Field>
            <Field label="Departure / Current Airport, if applicable">
              <Input name="departure_current_airport" className="min-h-11 bg-white/80 uppercase" />
            </Field>
            <Field label="Destination Airport, if applicable">
              <Input name="destination_airport" className="min-h-11 bg-white/80 uppercase" />
            </Field>
            <Field label="Timeline / Urgency" required>
              <NativeSelect name="timeline_urgency" options={timelineOptions} required />
            </Field>
            <Field label="Owner/Operator Approval Status" required>
              <NativeSelect name="owner_operator_approval_status" options={ownerApprovalStatuses} required />
            </Field>
            <Field label="Known Limitations / Squawks / Inspection Concerns" className="md:col-span-2">
              <Textarea name="known_limitations" className="min-h-28 bg-white/80" />
            </Field>
            <Field label="Additional Notes" className="md:col-span-2">
              <Textarea name="additional_notes" className="min-h-28 bg-white/80" />
            </Field>
            <p className="rounded-xl border border-[var(--oc-line)] bg-white/70 p-4 text-sm leading-relaxed text-[var(--oc-muted)] md:col-span-2">
              AMG Aviation does not provide emergency response services through this website or portal. Time-sensitive
              requests remain subject to review, availability, and operational conditions. International requests may
              require additional review for service availability, crew availability, vendor participation, regulatory,
              customs, insurance, and local operating requirements.
            </p>
          </Section>

          <section className="rounded-2xl border border-[var(--oc-line)] bg-white/70 p-5">
            <p className="oc-eyebrow text-[0.68rem] text-[var(--oc-blue)]">Section 6</p>
            <h2 className="mt-2 text-lg font-semibold text-[var(--oc-ink)]">Acknowledgment and Submission</h2>
            <Separator className="my-4 bg-[var(--oc-line)]" />
            <label className="flex items-start gap-3 text-sm leading-relaxed text-[var(--oc-muted)]">
              <input name="acknowledgment" value="accepted" type="checkbox" required className="mt-1 h-4 w-4 accent-[var(--oc-blue)]" />
              <span>
                I understand that submitting this support request does not confirm support acceptance, crew availability,
                aircraft movement, maintenance flight approval, or operational authorization. AMG must review support
                scope, aircraft status, crew availability, owner/operator approval, and operational conditions before a
                request is accepted. I have reviewed the <Link href="/privacy-policy" className="font-semibold text-[var(--oc-blue)] hover:text-[var(--oc-navy)]">Privacy Policy</Link>, <Link href="/terms" className="font-semibold text-[var(--oc-blue)] hover:text-[var(--oc-navy)]">Terms</Link>, and <Link href="/mission-acceptance" className="font-semibold text-[var(--oc-blue)] hover:text-[var(--oc-navy)]">Mission Acceptance Disclaimer</Link>.
              </span>
            </label>
            <label className="mt-4 flex items-start gap-3 text-sm leading-relaxed text-[var(--oc-muted)]">
              <input name="marketing_consent" value="yes" type="checkbox" className="mt-1 h-4 w-4 accent-[var(--oc-blue)]" />
              <span>
                I agree to receive optional AMG email updates. Transactional emails about this support request may still
                be sent without marketing consent.
              </span>
            </label>
            <label className="mt-4 flex items-start gap-3 text-sm leading-relaxed text-[var(--oc-muted)]">
              <input name="sms_consent" value="yes" type="checkbox" className="mt-1 h-4 w-4 accent-[var(--oc-blue)]" />
              <span>
                I agree to receive optional AMG text messages about this support request or related operational
                administration. Message and data rates may apply. See the <Link href="/legal/sms-terms" className="font-semibold text-[var(--oc-blue)] hover:text-[var(--oc-navy)]">SMS Terms</Link>.
              </span>
            </label>
            <p className="mt-5 rounded-xl border border-[var(--oc-line)] bg-[var(--oc-ivory)] p-4 text-sm leading-relaxed text-[var(--oc-muted)]">Submitting starts AMG’s review. Support is not accepted until AMG confirms scope and availability.</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <SubmitButton />
              <Button asChild variant="outline" className="min-h-11 rounded-full">
                <Link href="/contact" prefetch={false}>
                  General Contact
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </section>
        </form>
      </CardContent>
    </Card>
  );
}
