"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { ArrowLeft, ArrowRight, CheckCircle2, Send } from "lucide-react";
import { submitSupportRequest } from "@/app/(public)/contact/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SafeErrorMessage } from "@/components/ui/safe-error-message";
import {
  aircraftCategories,
  aircraftStatuses,
  conditionalSupportFields,
  ownerApprovalStatuses,
  requesterRoles,
  supportPaths,
  timelineOptions,
  type ConditionalField,
} from "@/lib/public-form-options";

type SupportPathValue = (typeof supportPaths)[number]["value"];

const steps = [
  { id: "contact", label: "Contact" },
  { id: "aircraft", label: "Aircraft" },
  { id: "need", label: "Support need" },
  { id: "review", label: "Timing and review" },
] as const;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="min-h-12 rounded-full bg-[var(--instrument)] px-6 text-white hover:bg-[var(--oc-navy)]">
      {pending ? "Submitting..." : "Submit for review"}
      <Send className="h-4 w-4" />
    </Button>
  );
}

function Field({
  id,
  label,
  children,
  required,
  help,
  className,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
  required?: boolean;
  help?: string;
  className?: string;
}) {
  return (
    <div className={`grid gap-2 ${className ?? ""}`}>
      <Label htmlFor={id} className="text-sm font-semibold text-[var(--oc-ink)]">
        {label}
        {required ? <span className="ml-1 text-[var(--oc-blue)]">*</span> : null}
      </Label>
      {children}
      {help ? <p id={`${id}-help`} className="text-xs leading-relaxed text-[var(--oc-muted)]">{help}</p> : null}
    </div>
  );
}

function NativeSelect({
  id,
  name,
  options,
  required,
  value,
  onChange,
  describedBy,
}: {
  id: string;
  name: string;
  options: readonly { value: string; label: string }[];
  required?: boolean;
  value?: string;
  onChange?: (value: string) => void;
  describedBy?: string;
}) {
  return (
    <select
      id={id}
      name={name}
      required={required}
      value={value}
      onChange={(event) => onChange?.(event.target.value)}
      aria-describedby={describedBy}
      className="support-field min-h-11 bg-[#0A1322]/85 px-3 text-sm"
    >
      <option value="Not sure">Not sure</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
    </select>
  );
}

function ConditionalInput({ field, supportPath }: { field: ConditionalField; supportPath: string }) {
  const id = `${supportPath}-${field.name}`.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return (
    <Field id={id} label={field.label} required={field.required}>
      {field.type === "textarea" ? (
        <Textarea id={id} name={field.name} required={field.required} placeholder={field.placeholder} className="min-h-28 bg-[#0A1322]/85" />
      ) : field.type === "select" && field.options ? (
        <NativeSelect id={id} name={field.name} options={field.options} required={field.required} />
      ) : (
        <Input id={id} name={field.name} type={field.type ?? "text"} required={field.required} placeholder={field.placeholder} className="min-h-11 bg-[#0A1322]/85" />
      )}
    </Field>
  );
}

function StepPanel({
  index,
  activeStep,
  title,
  children,
}: {
  index: number;
  activeStep: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset hidden={activeStep !== index} className="rounded-2xl border border-[var(--oc-line)] bg-[var(--oc-ivory)]/70 p-5">
      <legend className="px-1 text-lg font-semibold text-[var(--oc-ink)]">{title}</legend>
      <div className="mt-5 grid gap-5 md:grid-cols-2">{children}</div>
    </fieldset>
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
  const defaultPath = supportPaths.find((path) => path.value === initialSupportPath)?.value ?? "Contract Pilot Support";
  const [supportPath, setSupportPath] = useState<SupportPathValue>(defaultPath);
  const [activeStep, setActiveStep] = useState(0);
  const conditionalFields = useMemo(() => conditionalSupportFields[supportPath] ?? [], [supportPath]);

  return (
    <Card className="oc-card rounded-2xl border-[var(--oc-line)] p-0">
      <CardContent className="p-5 sm:p-6 lg:p-8">
        <div>
          <p className="oc-eyebrow text-[var(--oc-blue)]">Aircraft support request</p>
          <h2 className="oc-display mt-3 text-3xl text-[var(--oc-ink)] sm:text-4xl">Share the details AMG needs to review.</h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[var(--oc-muted)]">
            Start with the essentials. Tail number, home base, aircraft status, route details, and company information can be added when known.
          </p>
        </div>

        {success ? (
          <div role="status" className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm leading-relaxed text-emerald-900">
            <div className="flex gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Request received. AMG will review the details and may ask for additional aircraft, timing, approval, or document information.
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

        <ol className="mt-7 grid grid-cols-2 gap-2 md:grid-cols-4" aria-label="Support request progress">
          {steps.map((step, index) => (
            <li key={step.id}>
              <button
                type="button"
                onClick={() => setActiveStep(index)}
                aria-current={activeStep === index ? "step" : undefined}
                className={`flex min-h-11 w-full items-center justify-center rounded-full border px-3 text-xs font-semibold transition ${
                  activeStep === index
                    ? "border-[var(--instrument)] bg-[var(--instrument)] text-white"
                    : "border-[var(--oc-line)] bg-[#0A1322]/85 text-[var(--oc-ink)] hover:border-[var(--oc-blue)]"
                }`}
              >
                {index + 1}. {step.label}
              </button>
            </li>
          ))}
        </ol>

        <form action={submitSupportRequest} noValidate className="mt-7 grid gap-6 text-[var(--oc-ink)]">
          <input id="support-website" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

          <StepPanel index={0} activeStep={activeStep} title="Contact">
            <Field id="support-full-name" label="Full name" required>
              <Input id="support-full-name" name="full_name" required autoComplete="name" className="min-h-11 bg-[#0A1322]/85" />
            </Field>
            <Field id="support-email" label="Email" required>
              <Input id="support-email" name="email" type="email" required autoComplete="email" className="min-h-11 bg-[#0A1322]/85" />
            </Field>
            <Field id="support-phone" label="Phone">
              <Input id="support-phone" name="phone" type="tel" autoComplete="tel" className="min-h-11 bg-[#0A1322]/85" />
            </Field>
            <Field id="support-company" label="Company / operator">
              <Input id="support-company" name="company_operator" autoComplete="organization" className="min-h-11 bg-[#0A1322]/85" />
            </Field>
            <Field id="support-requester-role" label="Requester role" className="md:col-span-2">
              <NativeSelect id="support-requester-role" name="requester_role" options={requesterRoles} />
            </Field>
          </StepPanel>

          <StepPanel index={1} activeStep={activeStep} title="Aircraft">
            <Field id="support-aircraft-category" label="Aircraft category" required>
              <NativeSelect id="support-aircraft-category" name="aircraft_category" options={aircraftCategories} required />
            </Field>
            <Field id="support-aircraft-type" label="Aircraft type" required help="Example: Citation M2, Phenom 300, Challenger 350, SR22.">
              <Input id="support-aircraft-type" name="aircraft_type" required aria-describedby="support-aircraft-type-help" className="min-h-11 bg-[#0A1322]/85" />
            </Field>
            <Field id="support-tail-number" label="Tail number">
              <Input id="support-tail-number" name="tail_number" placeholder="N123AB" className="min-h-11 bg-[#0A1322]/85 uppercase" />
            </Field>
            <Field id="support-home-airport" label="Home base">
              <Input id="support-home-airport" name="home_airport" placeholder="KPMP, KFXE, KTEB" className="min-h-11 bg-[#0A1322]/85 uppercase" />
            </Field>
            <Field id="support-current-location" label="Current location">
              <Input id="support-current-location" name="current_aircraft_location" className="min-h-11 bg-[#0A1322]/85" />
            </Field>
            <Field id="support-aircraft-status" label="Aircraft status" help="Use this to flag whether the aircraft is active, in maintenance, unavailable, or still being reviewed.">
              <NativeSelect id="support-aircraft-status" name="aircraft_status" options={aircraftStatuses} describedBy="support-aircraft-status-help" />
            </Field>
          </StepPanel>

          <StepPanel index={2} activeStep={activeStep} title="Support need">
            <Field id="support-path" label="Support category" required className="md:col-span-2">
              <NativeSelect
                id="support-path"
                name="support_path"
                options={supportPaths}
                required
                value={supportPath}
                onChange={(value) => {
                  if (supportPaths.some((path) => path.value === value)) {
                    setSupportPath(value as SupportPathValue);
                  }
                }}
              />
            </Field>
            <Field id="support-summary" label="Plain-language description of the need" required className="md:col-span-2">
              <Textarea id="support-summary" name="requested_support_summary" required className="min-h-32 bg-[#0A1322]/85" />
            </Field>
            {conditionalFields.slice(0, 6).map((field) => (
              <ConditionalInput key={`${supportPath}-${field.name}`} field={field} supportPath={supportPath} />
            ))}
            <p className="rounded-xl border border-[var(--oc-line)] bg-[#0A1322]/85 p-4 text-sm leading-relaxed text-[var(--oc-muted)] md:col-span-2">
              Do not enter full credit card numbers, CVV codes, bank account numbers, or routing numbers.
            </p>
          </StepPanel>

          <StepPanel index={3} activeStep={activeStep} title="Timing and review">
            <Field id="support-start-date" label="Desired date">
              <Input id="support-start-date" name="desired_start_date" type="date" className="min-h-11 bg-[#0A1322]/85" />
            </Field>
            <Field id="support-timeline" label="Urgency / timeline" required>
              <NativeSelect id="support-timeline" name="timeline_urgency" options={timelineOptions} required />
            </Field>
            <Field id="support-departure" label="Departure / current airport">
              <Input id="support-departure" name="departure_current_airport" className="min-h-11 bg-[#0A1322]/85 uppercase" />
            </Field>
            <Field id="support-destination" label="Destination airport">
              <Input id="support-destination" name="destination_airport" className="min-h-11 bg-[#0A1322]/85 uppercase" />
            </Field>
            <Field id="support-approval" label="Owner/operator approval status" required help="Select whether the owner or responsible operator has approved AMG reviewing this request.">
              <NativeSelect id="support-approval" name="owner_operator_approval_status" options={ownerApprovalStatuses} required describedBy="support-approval-help" />
            </Field>
            <Field id="support-limitations" label="Known limitations or concerns">
              <Textarea id="support-limitations" name="known_limitations" className="min-h-28 bg-[#0A1322]/85" />
            </Field>
            <Field id="support-additional-notes" label="Additional notes" className="md:col-span-2">
              <Textarea id="support-additional-notes" name="additional_notes" className="min-h-28 bg-[#0A1322]/85" />
            </Field>
            <div className="grid gap-3 md:col-span-2 md:grid-cols-2">
              <label className="flex items-start gap-3 rounded-xl border border-[var(--oc-line)] bg-[#0A1322]/85 p-4 text-sm leading-relaxed text-[var(--oc-muted)]">
                <input name="marketing_consent" value="true" type="checkbox" className="mt-1 h-4 w-4 accent-[var(--oc-blue)]" />
                <span>AMG may email me relevant updates about aviation support services.</span>
              </label>
              <label className="flex items-start gap-3 rounded-xl border border-[var(--oc-line)] bg-[#0A1322]/85 p-4 text-sm leading-relaxed text-[var(--oc-muted)]">
                <input name="sms_consent" value="true" type="checkbox" className="mt-1 h-4 w-4 accent-[var(--oc-blue)]" />
                <span>AMG may text me about this request. Message and data rates may apply.</span>
              </label>
            </div>
            <label className="flex items-start gap-3 rounded-xl border border-[var(--oc-line)] bg-[#0A1322]/85 p-4 text-sm leading-relaxed text-[var(--oc-muted)] md:col-span-2">
              <input name="acknowledgment" value="accepted" type="checkbox" required className="mt-1 h-4 w-4 accent-[var(--oc-blue)]" />
              <span>
                I understand that submitting this request starts AMG’s review and does not confirm support, crew availability, aircraft movement, or operational approval. I have reviewed the <Link href="/privacy-policy" className="font-semibold text-[var(--oc-blue)] hover:text-[var(--oc-navy)]">Privacy Policy</Link>, <Link href="/terms" className="font-semibold text-[var(--oc-blue)] hover:text-[var(--oc-navy)]">Terms</Link>, and <Link href="/mission-acceptance" className="font-semibold text-[var(--oc-blue)] hover:text-[var(--oc-navy)]">Mission Acceptance Policy</Link>.
              </span>
            </label>
          </StepPanel>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="min-h-11 rounded-full" disabled={activeStep === 0} onClick={() => setActiveStep((step) => Math.max(0, step - 1))}>
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              {activeStep < steps.length - 1 ? (
                <Button type="button" className="min-h-11 rounded-full bg-[var(--instrument)] text-white hover:bg-[var(--oc-navy)]" onClick={() => setActiveStep((step) => Math.min(steps.length - 1, step + 1))}>
                  Next
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : null}
            </div>
            {activeStep === steps.length - 1 ? <SubmitButton /> : null}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
