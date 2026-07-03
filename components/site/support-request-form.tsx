"use client";

import { useState } from "react";
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

const steps = [
  { id: "contact", label: "Contact" },
  { id: "need", label: "Need" },
  { id: "aircraft", label: "Aircraft & timing" },
  { id: "notes", label: "Notes" },
] as const;

const supportNeedOptions = [
  "Aircraft Movement",
  "Maintenance Repositioning",
  "Crew Support",
  "Recurring Support",
  "AMG Connect",
  "Other",
] as const;

type SupportNeedValue = (typeof supportNeedOptions)[number];

function resolveInitialNeed(value?: string): SupportNeedValue {
  const normalized = value?.toLowerCase() ?? "";
  if (normalized.includes("subscription") || normalized.includes("plan") || normalized.includes("recurring")) return "Recurring Support";
  if (normalized.includes("maintenance")) return "Maintenance Repositioning";
  if (normalized.includes("crew") || normalized.includes("pilot")) return "Crew Support";
  if (normalized.includes("connect") || normalized.includes("portal")) return "AMG Connect";
  if (normalized.includes("ferry") || normalized.includes("reposition") || normalized.includes("movement")) return "Aircraft Movement";
  return "Aircraft Movement";
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="min-h-12 rounded-full bg-[var(--oc-blue)] px-6 text-white hover:bg-[var(--oc-navy)]">
      {pending ? "Submitting..." : "Request Aircraft Support"}
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
    <fieldset hidden={activeStep !== index} className="rounded-lg border border-[var(--oc-line)] bg-[var(--oc-ivory)]/70 p-5">
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
  const [supportNeed, setSupportNeed] = useState<SupportNeedValue>(() => resolveInitialNeed(initialSupportPath));
  const [activeStep, setActiveStep] = useState(0);

  return (
    <Card className="oc-card rounded-lg border-[var(--oc-line)] p-0">
      <CardContent className="p-5 sm:p-6 lg:p-8">
        <div>
          <p className="oc-eyebrow text-[var(--oc-blue)]">Request Aircraft Support</p>
          <h2 className="oc-display mt-3 text-3xl text-[var(--oc-ink)] sm:text-4xl">
            Start with the details AMG needs first.
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[var(--oc-muted)]">
            Share contact information, the support need, aircraft context, timing, and a short note. AMG will follow up if deeper operational detail is required.
          </p>
        </div>

        {success ? (
          <div role="status" className="mt-6 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm leading-relaxed text-emerald-900">
            <div className="flex gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Request received. AMG will review the details and respond with the appropriate next step.
              </span>
            </div>
          </div>
        ) : null}
        {error ? (
          error === "missing" ? (
            <div role="alert" className="mt-6 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm leading-relaxed text-red-900">
              Complete the required fields and confirm the acknowledgment before submitting.
            </div>
          ) : error === "payment-data" ? (
            <div role="alert" className="mt-6 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm leading-relaxed text-red-900">
              Remove full card numbers, CVV codes, bank account numbers, or routing numbers before submitting. AMG does not process payment card or bank account payments through this website or portal.
            </div>
          ) : (
            <SafeErrorMessage area="request_support" action="submit" className="mt-6 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm leading-relaxed text-red-900" />
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
                    ? "border-[var(--oc-blue)] bg-[var(--oc-blue)] text-white"
                    : "border-[var(--oc-line)] bg-white/70 text-[var(--oc-ink)] hover:border-[var(--oc-blue)]"
                }`}
              >
                {index + 1}. {step.label}
              </button>
            </li>
          ))}
        </ol>

        <form action={submitSupportRequest} noValidate className="mt-7 grid gap-6 text-[var(--oc-ink)]">
          <input id="support-website" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
          <input type="hidden" name="support_type" value={supportNeed} />
          <input type="hidden" name="requested_service_category" value={supportNeed} />
          <input type="hidden" name="aircraft_category" value="Other / Not Sure" />
          <input type="hidden" name="aircraft_status" value="Unknown / To Be Reviewed" />
          <input type="hidden" name="owner_operator_approval_status" value="Unknown" />

          <StepPanel index={0} activeStep={activeStep} title="Step 1: Contact">
            <Field id="support-full-name" label="Full name" required>
              <Input id="support-full-name" name="full_name" required autoComplete="name" className="min-h-11 bg-white/80" />
            </Field>
            <Field id="support-email" label="Email" required>
              <Input id="support-email" name="email" type="email" required autoComplete="email" className="min-h-11 bg-white/80" />
            </Field>
            <Field id="support-phone" label="Phone">
              <Input id="support-phone" name="phone" type="tel" autoComplete="tel" className="min-h-11 bg-white/80" />
            </Field>
            <Field id="support-company" label="Company / operator">
              <Input id="support-company" name="company_operator" autoComplete="organization" className="min-h-11 bg-white/80" />
            </Field>
          </StepPanel>

          <StepPanel index={1} activeStep={activeStep} title="Step 2: What do you need?">
            <Field id="support-path" label="Support need" required className="md:col-span-2">
              <select
                id="support-path"
                name="support_path"
                required
                value={supportNeed}
                onChange={(event) => setSupportNeed(event.target.value as SupportNeedValue)}
                className="support-field min-h-11 bg-white/80 px-3 text-sm"
              >
                {supportNeedOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </Field>
          </StepPanel>

          <StepPanel index={2} activeStep={activeStep} title="Step 3: Aircraft and timing">
            <Field id="support-aircraft-type" label="Aircraft type" required help="Example: Citation M2, Phenom 300, Challenger 350, SR22, or Not sure.">
              <Input id="support-aircraft-type" name="aircraft_type" required aria-describedby="support-aircraft-type-help" className="min-h-11 bg-white/80" />
            </Field>
            <Field id="support-current-location" label="Current location">
              <Input id="support-current-location" name="departure_current_airport" placeholder="Airport, city, or facility" className="min-h-11 bg-white/80" />
            </Field>
            <Field id="support-destination" label="Destination if applicable">
              <Input id="support-destination" name="destination_airport" placeholder="Airport, city, or facility" className="min-h-11 bg-white/80" />
            </Field>
            <Field id="support-timing" label="Desired timing" required>
              <Input id="support-timing" name="timing" required placeholder="This week, next month, flexible, urgent, recurring" className="min-h-11 bg-white/80" />
            </Field>
          </StepPanel>

          <StepPanel index={3} activeStep={activeStep} title="Step 4: Notes">
            <Field id="support-summary" label="Short description / notes" required className="md:col-span-2">
              <Textarea
                id="support-summary"
                name="requested_support_summary"
                required
                className="min-h-36 bg-white/80"
                placeholder="Aircraft, movement, crew, maintenance, portal, or recurring support context."
              />
            </Field>
            <p className="rounded-lg border border-[var(--oc-line)] bg-white/70 p-4 text-sm leading-relaxed text-[var(--oc-muted)] md:col-span-2">
              Do not enter full credit card numbers, CVV codes, bank account numbers, or routing numbers.
            </p>
            <div className="grid gap-3 md:col-span-2 md:grid-cols-2">
              <label className="flex items-start gap-3 rounded-lg border border-[var(--oc-line)] bg-white/70 p-4 text-sm leading-relaxed text-[var(--oc-muted)]">
                <input name="marketing_consent" value="true" type="checkbox" className="mt-1 h-4 w-4 accent-[var(--oc-blue)]" />
                <span>AMG may email me relevant updates about aviation support services.</span>
              </label>
              <label className="flex items-start gap-3 rounded-lg border border-[var(--oc-line)] bg-white/70 p-4 text-sm leading-relaxed text-[var(--oc-muted)]">
                <input name="sms_consent" value="true" type="checkbox" className="mt-1 h-4 w-4 accent-[var(--oc-blue)]" />
                <span>AMG may text me about this request. Message and data rates may apply.</span>
              </label>
            </div>
            <label className="flex items-start gap-3 rounded-lg border border-[var(--oc-line)] bg-[var(--oc-ivory)] p-4 text-sm leading-relaxed text-[var(--oc-muted)] md:col-span-2">
              <input name="acknowledgment" value="accepted" type="checkbox" required className="mt-1 h-4 w-4 accent-[var(--oc-blue)]" />
              <span>
                I understand that submitting this request starts AMG&apos;s review and does not confirm support, crew availability, aircraft movement, or operational approval. I have reviewed the <Link href="/privacy-policy" className="font-semibold text-[var(--oc-blue)] hover:text-[var(--oc-navy)]">Privacy Policy</Link>, <Link href="/terms" className="font-semibold text-[var(--oc-blue)] hover:text-[var(--oc-navy)]">Terms</Link>, and <Link href="/mission-acceptance" className="font-semibold text-[var(--oc-blue)] hover:text-[var(--oc-navy)]">Mission Acceptance Policy</Link>.
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
                <Button type="button" className="min-h-11 rounded-full bg-[var(--oc-blue)] text-white hover:bg-[var(--oc-navy)]" onClick={() => setActiveStep((step) => Math.min(steps.length - 1, step + 1))}>
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
