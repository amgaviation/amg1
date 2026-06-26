"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { submitPublicServiceInquiry, type ServiceInquiryActionState } from "@/app/(public)/contact/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  PUBLIC_INQUIRY_SERVICE_BY_VALUE,
  PUBLIC_INQUIRY_SERVICES,
  type FieldErrors,
  type PublicInquiryContext,
  type PublicInquiryService,
} from "@/lib/public-inquiries";

type Values = Record<string, string | string[]>;
type ServiceValues = Partial<Record<PublicInquiryService, Values>>;

const initialState: ServiceInquiryActionState = { status: "idle" };

function first(values: Values, key: string) {
  const value = values[key];
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function ErrorText({ id, message }: { id: string; message?: string }) {
  return message ? <p id={id} className="text-sm font-medium text-red-200">{message}</p> : null;
}

function Field({
  id,
  name,
  label,
  value,
  onChange,
  error,
  required,
  helper,
  type = "text",
  autoComplete,
}: {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (name: string, value: string) => void;
  error?: string;
  required?: boolean;
  helper?: string;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id} className="text-sm font-semibold text-white">
        {label} <span className="font-normal text-[var(--oc-aluminum-2)]">{required ? "Required" : "Optional"}</span>
      </Label>
      <Input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={(event) => onChange(name, event.target.value)}
        autoComplete={autoComplete}
        aria-invalid={Boolean(error)}
        aria-describedby={[helper ? `${id}-help` : "", error ? `${id}-error` : ""].filter(Boolean).join(" ") || undefined}
        className="min-h-12 border-white/[0.16] bg-white/[0.08] text-white placeholder:text-white/35 focus-visible:ring-[var(--oc-blue)]"
      />
      {helper ? <p id={`${id}-help`} className="text-xs leading-relaxed text-[var(--oc-aluminum-2)]">{helper}</p> : null}
      <ErrorText id={`${id}-error`} message={error} />
    </div>
  );
}

function SelectField({
  id,
  name,
  label,
  value,
  options,
  onChange,
  error,
}: {
  id: string;
  name: string;
  label: string;
  value: string;
  options: readonly { value: string; label: string }[];
  onChange: (name: string, value: string) => void;
  error?: string;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id} className="text-sm font-semibold text-white">
        {label} <span className="font-normal text-[var(--oc-aluminum-2)]">Required</span>
      </Label>
      <select
        id={id}
        name={name}
        value={value}
        onChange={(event) => onChange(name, event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className="support-field min-h-12 rounded-md border border-white/[0.16] bg-[#07111F] px-3 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--oc-blue)]"
      >
        <option value="">Select one</option>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      <ErrorText id={`${id}-error`} message={error} />
    </div>
  );
}

function CheckboxGroup({
  legend,
  name,
  values,
  options,
  onChange,
  error,
}: {
  legend: string;
  name: string;
  values: string[];
  options: readonly { value: string; label: string }[];
  onChange: (name: string, value: string[]) => void;
  error?: string;
}) {
  return (
    <fieldset className="grid gap-3 md:col-span-2">
      <legend className="text-sm font-semibold text-white">
        {legend} <span className="font-normal text-[var(--oc-aluminum-2)]">Required</span>
      </legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((option) => {
          const checked = values.includes(option.value);
          return (
            <label key={option.value} className={cn("flex min-h-12 items-center gap-3 rounded-lg border px-3 py-2 text-sm text-[var(--oc-paper)]", checked ? "border-[var(--oc-blue)] bg-[var(--oc-blue)]/18" : "border-white/[0.14] bg-white/[0.06]")}>
              <input
                type="checkbox"
                name={name}
                value={option.value}
                checked={checked}
                onChange={(event) => onChange(name, event.target.checked ? [...values, option.value] : values.filter((item) => item !== option.value))}
                className="h-4 w-4 accent-[var(--oc-blue)]"
              />
              <span>{option.label}</span>
            </label>
          );
        })}
      </div>
      <ErrorText id={`${name}-error`} message={error} />
    </fieldset>
  );
}

function UrgentNotice() {
  return (
    <p className="rounded-lg border border-amber-300/30 bg-amber-300/10 p-3 text-sm leading-relaxed text-amber-100">
      Urgent submission flags AMG review priority, but it does not guarantee immediate support, dispatch, crew confirmation, aircraft availability, or operational approval.
    </p>
  );
}

function SuccessState({ state }: { state: ServiceInquiryActionState }) {
  if (state.status !== "success" && state.status !== "duplicate") return null;
  return (
    <div role="status" className="rounded-2xl border border-emerald-300/25 bg-emerald-400/10 p-5 text-emerald-50">
      <div className="flex gap-3">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <h2 className="text-lg font-semibold">{state.status === "duplicate" ? "Recent matching inquiry found" : "Inquiry received"}</h2>
          <p className="mt-2 text-sm leading-relaxed text-emerald-50/88">
            Reference: <span className="font-semibold">{state.reference}</span>{state.serviceLabel ? ` for ${state.serviceLabel}` : ""}. AMG will review the inquiry and follow up if the request is within scope.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-emerald-50/78">
            Submission is not mission acceptance, crew confirmation, aircraft availability, a quote, a contract, or operational approval.
          </p>
        </div>
      </div>
    </div>
  );
}

export function ServiceInquiryForm({ context }: { context: PublicInquiryContext }) {
  const [actionState, formAction, pending] = useActionState(submitPublicServiceInquiry, initialState);
  const [service, setService] = useState<PublicInquiryService | "">(context.service ?? "");
  const [common, setCommon] = useState<Values>({});
  const [serviceState, setServiceState] = useState<ServiceValues>({});
  const [idempotencyKey, setIdempotencyKey] = useState("");
  const id = useId();
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const selectedConfig = service ? PUBLIC_INQUIRY_SERVICE_BY_VALUE[service] : null;
  const selectedValues = service ? serviceState[service] ?? {} : {};
  const errors: FieldErrors = actionState.fieldErrors ?? {};
  const hasError = actionState.status === "validation_error" || actionState.status === "error";

  useEffect(() => {
    setIdempotencyKey(typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `inq-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  }, []);

  useEffect(() => {
    if (!actionState.values) return;
    const values = actionState.values;
    const submittedService = first(values, "service_type") as PublicInquiryService;
    setService(submittedService || context.service || "");
    setCommon({
      full_name: first(values, "full_name"),
      email: first(values, "email"),
      phone: first(values, "phone"),
      summary: first(values, "summary"),
      urgent: first(values, "urgent"),
    });
    if (submittedService) setServiceState((current) => ({ ...current, [submittedService]: values }));
  }, [actionState.values, context.service]);

  useEffect(() => {
    if (hasError) errorSummaryRef.current?.focus();
  }, [hasError]);

  useEffect(() => {
    if (!service) return;
    const params = new URLSearchParams(window.location.search);
    params.set("service", service);
    if (context.source) params.set("source", context.source);
    if (context.plan) params.set("plan", context.plan);
    if (context.aircraftCategory) params.set("aircraftCategory", context.aircraftCategory);
    window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
  }, [service, context.source, context.plan, context.aircraftCategory]);

  function updateCommon(name: string, value: string) {
    setCommon((current) => ({ ...current, [name]: value }));
  }
  function updateService(name: string, value: string | string[]) {
    if (!service) return;
    setServiceState((current) => ({ ...current, [service]: { ...(current[service] ?? {}), [name]: value } }));
  }
  const serviceValue = (name: string) => first(selectedValues, name);
  const serviceArray = (name: string) => {
    const value = selectedValues[name];
    return Array.isArray(value) ? value : typeof value === "string" && value ? [value] : [];
  };

  function renderServiceFields() {
    if (!service || !selectedConfig) return null;
    if (service === "aircraft-management") {
      return <>
        <Field id={`${id}-org`} name="organization" label="Company / owner entity" value={serviceValue("organization")} onChange={updateService} error={errors.organization} autoComplete="organization" />
        <Field id={`${id}-aircraft`} name="aircraft_identifier" label="Aircraft make/model or tail number" value={serviceValue("aircraft_identifier")} onChange={updateService} error={errors.aircraft_identifier} />
        <Field id={`${id}-base`} name="aircraft_base" label="Aircraft base or location" value={serviceValue("aircraft_base")} onChange={updateService} error={errors.aircraft_base} />
        <SelectField id={`${id}-need`} name="primary_support_need" label="Primary support need" value={serviceValue("primary_support_need")} options={selectedConfig.options.primarySupportNeed} onChange={updateService} error={errors.primary_support_need} />
      </>;
    }
    if (service === "contract-crew") {
      return <>
        <Field id={`${id}-aircraft`} name="aircraft_identifier" label="Aircraft make/model" value={serviceValue("aircraft_identifier")} onChange={updateService} error={errors.aircraft_identifier} required />
        <SelectField id={`${id}-position`} name="position_needed" label="Position needed" value={serviceValue("position_needed")} options={selectedConfig.options.positionNeeded} onChange={updateService} error={errors.position_needed} />
        <Field id={`${id}-coverage`} name="coverage_location" label="Coverage location" value={serviceValue("coverage_location")} onChange={updateService} error={errors.coverage_location} required helper="Airport, city, or operating base." />
        <Field id={`${id}-start`} name="start_timeframe" label="Start date or general timeframe" value={serviceValue("start_timeframe")} onChange={updateService} error={errors.start_timeframe} required />
      </>;
    }
    if (service === "ferry-repositioning") {
      return <>
        <Field id={`${id}-aircraft`} name="aircraft_identifier" label="Aircraft make/model or tail number" value={serviceValue("aircraft_identifier")} onChange={updateService} error={errors.aircraft_identifier} required />
        <Field id={`${id}-origin`} name="origin" label="Origin airport or location" value={serviceValue("origin")} onChange={updateService} error={errors.origin} required />
        <Field id={`${id}-destination`} name="destination" label="Destination airport or location" value={serviceValue("destination")} onChange={updateService} error={errors.destination} required />
        <Field id={`${id}-ready`} name="aircraft_ready_date" label="Aircraft-ready date" type="date" value={serviceValue("aircraft_ready_date")} onChange={updateService} error={errors.aircraft_ready_date} required />
      </>;
    }
    if (service === "maintenance-flight") {
      return <>
        <Field id={`${id}-aircraft`} name="aircraft_identifier" label="Aircraft make/model or tail number" value={serviceValue("aircraft_identifier")} onChange={updateService} error={errors.aircraft_identifier} required />
        <Field id={`${id}-location`} name="current_location" label="Current airport or aircraft location" value={serviceValue("current_location")} onChange={updateService} error={errors.current_location} required />
        <SelectField id={`${id}-support`} name="maintenance_support_type" label="Support needed" value={serviceValue("maintenance_support_type")} options={selectedConfig.options.maintenanceSupportType} onChange={updateService} error={errors.maintenance_support_type} />
        <Field id={`${id}-timeframe`} name="requested_timeframe" label="Requested date or timeframe" value={serviceValue("requested_timeframe")} onChange={updateService} error={errors.requested_timeframe} required />
      </>;
    }
    if (service === "operations-coordination") {
      return <>
        <Field id={`${id}-org`} name="organization" label="Company or flight department" value={serviceValue("organization")} onChange={updateService} error={errors.organization} autoComplete="organization" />
        <Field id={`${id}-aircraft-base`} name="aircraft_base_context" label="Aircraft / primary operating base" value={serviceValue("aircraft_base_context")} onChange={updateService} error={errors.aircraft_base_context} />
        <CheckboxGroup legend="Support areas" name="support_areas" values={serviceArray("support_areas")} options={selectedConfig.options.supportAreas} onChange={updateService} error={errors.support_areas} />
        <SelectField id={`${id}-timing`} name="timing_frequency" label="Timing or frequency" value={serviceValue("timing_frequency")} options={selectedConfig.options.timingFrequency} onChange={updateService} error={errors.timing_frequency} />
      </>;
    }
    if (service === "fleet-support") {
      return <>
        <Field id={`${id}-count`} name="aircraft_count" label="Number of aircraft" type="number" value={serviceValue("aircraft_count")} onChange={updateService} error={errors.aircraft_count} required />
        <Field id={`${id}-types`} name="aircraft_types_bases" label="Aircraft types and primary bases" value={serviceValue("aircraft_types_bases")} onChange={updateService} error={errors.aircraft_types_bases} />
        <SelectField id={`${id}-frequency`} name="support_frequency" label="Support frequency" value={serviceValue("support_frequency")} options={selectedConfig.options.supportFrequency} onChange={updateService} error={errors.support_frequency} />
        <CheckboxGroup legend="Support areas" name="fleet_support_areas" values={serviceArray("fleet_support_areas")} options={selectedConfig.options.fleetSupportAreas} onChange={updateService} error={errors.fleet_support_areas} />
      </>;
    }
    return null;
  }

  return (
    <div className="rounded-2xl border border-white/[0.12] bg-[#07111F] p-5 text-white shadow-[0_30px_90px_rgba(0,0,0,0.24)] sm:p-6 lg:p-8">
      <div className="mb-6">
        <p className="oc-eyebrow oc-eyebrow-light">Service Inquiry</p>
        <h2 className="oc-display mt-3 text-3xl text-white sm:text-4xl">Tell AMG what kind of support you need.</h2>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[var(--oc-aluminum)]">
          This short public inquiry helps AMG qualify and route the request. Detailed mission, crew, passenger, FBO, customs, and fulfillment information belongs in AMG Connect after review.
        </p>
      </div>
      <SuccessState state={actionState} />
      <form action={formAction} className={cn("grid gap-6", (actionState.status === "success" || actionState.status === "duplicate") && "mt-6")}>
        <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
        <input type="hidden" name="service_type" value={service} />
        <input type="hidden" name="source" value={context.source ?? ""} />
        <input type="hidden" name="plan" value={context.plan ?? ""} />
        <input type="hidden" name="aircraftCategory" value={context.aircraftCategory ?? ""} />
        <input type="hidden" name="idempotency_key" value={idempotencyKey} />
        {hasError ? (
          <div ref={errorSummaryRef} tabIndex={-1} role="alert" className="rounded-xl border border-red-300/30 bg-red-400/10 p-4 text-sm leading-relaxed text-red-100 outline-none">
            <p className="font-semibold">Please review the inquiry.</p>
            <p className="mt-1">{actionState.formError ?? "Some required fields need attention."}</p>
          </div>
        ) : null}
        <fieldset className="grid gap-3">
          <legend className="text-base font-semibold text-white">Service needed <span className="font-normal text-[var(--oc-aluminum-2)]">Required</span></legend>
          <div className="grid gap-3 md:grid-cols-2">
            {PUBLIC_INQUIRY_SERVICES.map((item) => (
              <label key={item.value} className={cn("flex min-h-24 cursor-pointer gap-3 rounded-xl border p-4 transition-colors", service === item.value ? "border-[var(--oc-blue)] bg-[var(--oc-blue)]/18 ring-1 ring-[var(--oc-blue)]" : "border-white/[0.14] bg-white/[0.05] hover:border-white/[0.32]")}>
                <input type="radio" name="service_choice" value={item.value} checked={service === item.value} onChange={() => setService(item.value)} className="mt-1 h-4 w-4 accent-[var(--oc-blue)]" />
                <span>
                  <span className="block text-sm font-semibold text-white">{item.label}</span>
                  <span className="mt-1 block text-xs leading-relaxed text-[var(--oc-aluminum-2)]">{item.description}</span>
                </span>
              </label>
            ))}
          </div>
          <ErrorText id="service-type-error" message={errors.service_type} />
        </fieldset>
        <div className="grid gap-5 md:grid-cols-2">
          <Field id={`${id}-name`} name="full_name" label="Full name" value={first(common, "full_name")} onChange={updateCommon} error={errors.full_name} required autoComplete="name" />
          <Field id={`${id}-email`} name="email" label="Email" type="email" value={first(common, "email")} onChange={updateCommon} error={errors.email} required autoComplete="email" />
          <Field id={`${id}-phone`} name="phone" label="Phone" type="tel" value={first(common, "phone")} onChange={updateCommon} error={errors.phone} autoComplete="tel" helper="Required for urgent or AOG inquiries." />
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor={`${id}-summary`} className="text-sm font-semibold text-white">
              Brief details <span className="font-normal text-[var(--oc-aluminum-2)]">{service === "general" ? "Required" : "Optional"}</span>
            </Label>
            <Textarea id={`${id}-summary`} name="summary" value={first(common, "summary")} onChange={(event) => updateCommon("summary", event.target.value)} maxLength={2000} aria-invalid={Boolean(errors.summary)} aria-describedby={errors.summary ? `${id}-summary-error` : undefined} className="min-h-32 border-white/[0.16] bg-white/[0.08] text-white placeholder:text-white/35 focus-visible:ring-[var(--oc-blue)]" />
            <ErrorText id={`${id}-summary-error`} message={errors.summary} />
          </div>
        </div>
        {selectedConfig?.urgentEligible && service !== "maintenance-flight" ? (
          <div className="grid gap-3">
            <label className="flex min-h-12 items-start gap-3 rounded-lg border border-white/[0.14] bg-white/[0.06] p-3 text-sm text-[var(--oc-paper)]">
              <input type="checkbox" name="urgent" value="yes" checked={first(common, "urgent") === "yes"} onChange={(event) => updateCommon("urgent", event.target.checked ? "yes" : "")} className="mt-1 h-4 w-4 accent-[var(--oc-blue)]" />
              <span>Flag as urgent or time-sensitive</span>
            </label>
            {first(common, "urgent") === "yes" ? <UrgentNotice /> : null}
          </div>
        ) : null}
        {service === "maintenance-flight" && serviceValue("maintenance_support_type") === "aog-urgent" ? <UrgentNotice /> : null}
        <div aria-live="polite" className="sr-only">{selectedConfig ? `${selectedConfig.label} fields are now shown.` : "Choose a service to show related fields."}</div>
        {service ? <section className="grid gap-5 rounded-xl border border-white/[0.12] bg-white/[0.04] p-4 md:grid-cols-2">{renderServiceFields()}</section> : null}
        <p className="rounded-xl border border-white/[0.12] bg-white/[0.05] p-4 text-sm leading-relaxed text-[var(--oc-aluminum)]">
          Submitting this inquiry does not constitute mission acceptance, crew confirmation, aircraft availability, a binding quote, a contract, or operational approval.
        </p>
        <Button type="submit" disabled={pending} className="min-h-12 w-full rounded-full bg-[var(--oc-blue)] text-white hover:bg-white hover:text-[var(--oc-navy)] sm:w-auto sm:px-7">
          {pending ? "Sending Inquiry..." : selectedConfig?.submitLabel ?? "Send Inquiry"}
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
