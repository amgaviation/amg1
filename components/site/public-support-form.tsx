"use client";

import { useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, ClipboardCheck, Plane, Send } from "lucide-react";
import { submitPublicSupportRequest } from "@/app/(public)/contact/actions";
import { COMPANY } from "@/lib/content";

const categories = [
  {
    value: "aircraft-management-support",
    label: "Aircraft Support Administration",
    help: "For recurring owner communication, records, scheduling inputs, crew coordination, and aircraft-support administration.",
    fields: [
      ["ownership_entity", "Ownership or operating entity", "text", true],
      ["current_crew_arrangement", "Current crew arrangement", "text", true],
      ["existing_management_arrangement", "Existing management arrangement", "text", false],
      ["maintenance_tracking_system", "Maintenance tracking system", "text", false],
      ["scheduling_expectations", "Scheduling expectations", "textarea", true],
      ["records_status", "Records status", "textarea", false],
      ["accounting_support_requirements", "Accounting support requirements", "textarea", false],
      ["desired_management_scope", "Desired support scope", "textarea", true],
      ["anticipated_start_date", "Anticipated start date", "date", false],
      ["number_of_aircraft", "Number of aircraft", "number", true],
      ["current_operational_concerns", "Current aircraft/support concerns", "textarea", false],
    ],
  },
  {
    value: "contract-pilot-support",
    label: "Contract Pilot Support",
    help: "For PIC, SIC, or two-pilot support tied to a specific aircraft, date, route, repositioning event, or coverage need.",
    fields: [
      ["crew_seat", "PIC, SIC, or both", "text", true],
      ["type_rating_requirements", "Type-rating requirements", "text", false],
      ["insurance_minimums", "Insurance minimums", "textarea", false],
      ["requested_dates", "Requested dates", "text", true],
      ["origin", "Origin", "text", true],
      ["destination", "Destination", "text", true],
      ["estimated_duty_period", "Estimated duty period", "text", false],
      ["number_of_legs", "Number of legs", "number", false],
      ["domestic_or_international", "Domestic or international", "text", true],
      ["passport_requirement", "Passport requirement", "text", false],
      ["currency_requirements", "Currency requirements", "textarea", false],
      ["crew_positioning_expectations", "Crew positioning expectations", "textarea", false],
      ["lodging_requirements", "Lodging requirements", "textarea", false],
      ["known_operator_requirements", "Known operator requirements", "textarea", false],
      ["special_mission_notes", "Special support notes", "textarea", false],
    ],
  },
  {
    value: "ferry-and-repositioning",
    label: "Ferry and Repositioning",
    help: "For aircraft movement related to maintenance, delivery, storage, pre-buy, or owner-approved repositioning.",
    fields: [
      ["current_aircraft_location", "Current aircraft location", "text", true],
      ["destination", "Destination", "text", true],
      ["desired_movement_date", "Desired movement date", "date", true],
      ["airworthiness_status", "Aircraft airworthiness status", "text", true],
      ["maintenance_status", "Maintenance status", "textarea", true],
      ["ferry_permit_status", "Ferry-permit status", "text", false],
      ["owner_operator_authorization_status", "Owner/operator authorization status", "text", true],
      ["maintenance_facility_contact", "Maintenance-facility contact", "textarea", false],
      ["aircraft_records_availability", "Aircraft records availability", "text", false],
      ["international_customs_requirements", "International/customs requirements", "textarea", false],
      ["required_crew_qualifications", "Required crew qualifications", "textarea", false],
      ["known_squawks_or_limitations", "Known squawks or limitations", "textarea", false],
      ["special_equipment_requirements", "Special equipment requirements", "textarea", false],
    ],
  },
  {
    value: "maintenance-flight-support",
    label: "Maintenance Flight Support",
    help: "For maintenance positioning, return-to-service context, functional-check, or acceptance-flight support review.",
    fields: [
      ["maintenance_facility", "Maintenance facility", "text", true],
      ["facility_contact", "Facility contact", "textarea", true],
      ["inspection_or_maintenance_event", "Inspection or maintenance event", "textarea", true],
      ["aircraft_release_status", "Aircraft release status", "text", true],
      ["return_to_service_status", "Return-to-service status", "text", false],
      ["functional_check_flight_requirement", "Functional-check-flight requirement", "text", false],
      ["acceptance_flight_requirement", "Acceptance-flight requirement", "text", false],
      ["proposed_flight_profile", "Proposed flight profile", "textarea", false],
      ["responsible_operator", "Responsible operator", "text", true],
      ["required_pilot_qualifications", "Required pilot qualifications", "textarea", false],
      ["maintenance_documentation_status", "Maintenance documentation status", "textarea", false],
      ["desired_completion_date", "Desired completion date", "date", false],
      ["known_discrepancies", "Known discrepancies", "textarea", false],
    ],
  },
  {
    value: "flight-operations-coordination",
    label: "Support Operations Coordination",
    help: "For support intake, crew logistics, vendor communication, travel, lodging, documentation, and approved stakeholder updates.",
    fields: [
      ["mission_dates", "Requested support dates", "text", true],
      ["origin_destination", "Origin and destination", "text", true],
      ["number_of_passengers", "Passenger count if relevant", "number", false],
      ["crew_requirements", "Crew requirements", "textarea", true],
      ["aircraft_status", "Aircraft status", "text", true],
      ["fbo_requirements", "FBO requirements", "textarea", false],
      ["ground_transportation", "Ground transportation", "textarea", false],
      ["lodging", "Lodging", "textarea", false],
      ["international_requirements", "International requirements", "textarea", false],
      ["permit_requirements", "Permit requirements", "textarea", false],
      ["catering", "Catering", "textarea", false],
      ["special_timing_or_access_restrictions", "Special timing or access restrictions", "textarea", false],
      ["primary_decision_maker", "Primary decision maker", "text", true],
    ],
  },
  {
    value: "fleet-support-program",
    label: "Fleet / Department Support",
    help: "For multi-aircraft or recurring support programs with defined coordination structure.",
    fields: [
      ["number_of_aircraft", "Number of aircraft", "number", true],
      ["aircraft_types", "Aircraft types", "textarea", true],
      ["bases", "Bases", "textarea", true],
      ["current_staffing", "Current staffing", "textarea", true],
      ["expected_monthly_activity", "Expected monthly activity", "textarea", true],
      ["maintenance_activity", "Maintenance activity", "textarea", false],
      ["desired_support_functions", "Desired support functions", "textarea", true],
      ["reporting_needs", "Reporting needs", "textarea", false],
      ["dedicated_contact_requirement", "Dedicated-contact requirement", "text", false],
      ["after_hours_requirement", "After-hours requirement", "text", false],
      ["anticipated_start_date", "Anticipated start date", "date", false],
    ],
  },
  {
    value: "subscription-program-inquiry",
    label: "Support Plan Inquiry",
    help: "For aircraft-class, billing, allowance, tier, travel, lodging, and proposal questions.",
    fields: [
      ["aircraft_category", "Aircraft category", "text", true],
      ["single_or_two_pilot", "Single-pilot or two-pilot requirement", "text", true],
      ["preferred_billing", "Preferred monthly or annual billing", "text", true],
      ["expected_client_flight_duty_days", "Expected support duty days", "number", false],
      ["expected_mx_movements", "Expected maintenance movements", "number", false],
      ["domestic_or_international_activity", "Domestic or international activity", "text", false],
      ["expected_overnight_frequency", "Expected overnight frequency", "text", false],
      ["travel_lodging_preference", "Travel/lodging preference", "textarea", false],
      ["desired_tier", "Desired support tier", "text", false],
      ["expected_start_date", "Expected start date", "date", false],
      ["questions_or_special_requirements", "Questions or special requirements", "textarea", false],
    ],
  },
  {
    value: "other-support",
    label: "Other Support",
    help: "For aircraft support needs that do not fit the standard categories.",
    fields: [
      ["aircraft_information", "Aircraft information", "textarea", true],
      ["detailed_support_description", "Detailed support description", "textarea", true],
      ["relevant_contacts", "Relevant contacts", "textarea", false],
      ["documents_available", "Documents available", "textarea", false],
    ],
  },
] as const;

type CategoryValue = (typeof categories)[number]["value"];
type FieldConfig = (typeof categories)[number]["fields"][number];

function SubmitRequestButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="oc-btn oc-btn-primary mt-7 w-full justify-center disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
    >
      {pending ? "Submitting..." : "Submit for Review"}
      <Send className="h-4 w-4" />
    </button>
  );
}

function Field({ field, defaultValue }: { field: FieldConfig; defaultValue?: string }) {
  const [name, label, type, required] = field;
  const common = "support-field px-4 text-base";

  return (
    <label className="group grid gap-2 text-sm font-medium text-[var(--oc-ink)]">
      <span className="flex items-center justify-between gap-3">
        {label}
        {required ? <span className="text-[var(--oc-blue)]">*</span> : <span className="text-xs text-[var(--oc-muted)]">Optional</span>}
      </span>
      {type === "textarea" ? (
        <textarea name={name} required={required} defaultValue={defaultValue} className={`${common} min-h-28 py-3`} />
      ) : (
        <input name={name} type={type} required={required} defaultValue={defaultValue} className={common} />
      )}
    </label>
  );
}

function normalizeCategory(value?: string) {
  if (!value) return "aircraft-management-support";
  const match = categories.find((category) => category.value === value);
  return match?.value ?? "aircraft-management-support";
}

export function PublicSupportForm({
  initialCategory,
  initialPlan,
  success,
  error,
  duplicate,
}: {
  initialCategory?: string;
  initialPlan?: string;
  success?: string;
  error?: string;
  duplicate?: string;
}) {
  const reduce = useReducedMotion();
  const [category, setCategory] = useState<CategoryValue>(normalizeCategory(initialCategory) as CategoryValue);
  const activeCategory = useMemo(
    () => categories.find((item) => item.value === category) ?? categories[0],
    [category]
  );
  const activeCategoryIndex = categories.findIndex((item) => item.value === category);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      document
        .querySelector<HTMLElement>(`[data-category-chip="${category}"]`)
        ?.scrollIntoView({ block: "nearest", inline: "center" });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [category]);

  return (
    <form action={submitPublicSupportRequest} className="support-form support-command oc-card overflow-hidden p-0 shadow-[var(--oc-shadow)]" data-scroll-animate>
      <div className="border-b border-[var(--oc-line)] p-6 lg:p-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_14rem]">
          <div>
            <p className="oc-kicker text-[var(--oc-blue)]">Support Intake</p>
            <h2 className="oc-display mt-4 text-4xl text-[var(--oc-ink)] sm:text-5xl">
              Define the support need
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[var(--oc-muted)]">
              Give AMG the aircraft, timing, crew need, and support category so the operations desk can route the
              request to the right review path.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 lg:grid-cols-1">
            {[
              ["01", "Contact"],
              ["02", "Aircraft"],
              ["03", "Scope"],
            ].map(([step, label]) => (
              <div key={step} className="rounded-lg border border-[var(--oc-line)] bg-[var(--oc-ivory)] p-3">
                <p className="oc-mono text-lg text-[var(--oc-blue)]">{step}</p>
                <p className="oc-kicker mt-1 text-[0.58rem] text-[var(--oc-muted)]">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6 lg:p-8">
      {success ? (
        <div role="status" className="mb-5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm leading-relaxed text-emerald-900">
          Inquiry received. AMG will review the submitted details and route the request based on support scope, aircraft context, timing, and operational requirements.
          {success !== "received" ? ` Reference: ${success}.` : ""}
          {duplicate ? " We found a matching recent request and returned the existing reference." : ""}
        </div>
      ) : null}
      {error ? (
        <div role="alert" className="mb-5 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm leading-relaxed text-red-900">
          {error === "missing"
            ? "Please complete the required fields and accept the privacy and terms acknowledgment."
            : error === "email"
              ? "The inquiry was received, but AMG could not send one of the notification emails. AMG has still stored the submission for review."
            : "The request could not be submitted. Please try again or email AMG Operations directly."}
        </div>
      ) : null}

      <div className="mb-8 rounded-lg border border-[var(--oc-line)] bg-[var(--oc-ivory)] p-3">
        <div className="mb-3 flex items-center justify-between gap-4 px-1">
          <p className="oc-kicker text-[0.64rem] text-[var(--oc-blue)]">Support Path</p>
          <span className="oc-mono text-xs text-[var(--oc-muted)]">
            {String(activeCategoryIndex + 1).padStart(2, "0")} / {String(categories.length).padStart(2, "0")}
          </span>
        </div>
        <div className="flex snap-x gap-2 overflow-x-auto pb-1" data-stagger-container>
          {categories.map((item, index) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setCategory(item.value)}
              data-category-chip={item.value}
              className={`min-h-11 snap-start whitespace-nowrap rounded-full border px-4 py-2 text-left text-xs font-semibold uppercase transition-colors ${
                category === item.value
                  ? "border-[var(--oc-blue)] bg-[var(--oc-blue)]/10 text-[var(--oc-blue)]"
                  : "border-[var(--oc-line)] bg-[var(--oc-paper)] text-[var(--oc-muted)] hover:border-[var(--oc-blue)]/50 hover:text-[var(--oc-ink)]"
              }`}
              aria-pressed={category === item.value}
              data-stagger-item
            >
              <span className="mr-2 text-[var(--oc-aluminum-2)]">{String(index + 1).padStart(2, "0")}</span>
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <fieldset className="support-form-panel grid gap-5 rounded-lg border border-[var(--oc-line)] bg-[var(--oc-ivory)] p-5 md:grid-cols-2">
        <legend className="mb-1 flex items-center gap-2 font-display text-2xl font-bold uppercase text-[var(--oc-ink)] md:col-span-2">
          <ClipboardCheck className="h-5 w-5 text-[var(--oc-blue)]" />
          Contact information
        </legend>
        <label className="grid gap-2 text-sm font-medium text-[var(--oc-ink)]">
          First name <span className="text-[var(--oc-blue)]">*</span>
          <input name="first_name" required autoComplete="given-name" className="support-field px-4 text-base" />
        </label>
        <label className="grid gap-2 text-sm font-medium text-[var(--oc-ink)]">
          Last name <span className="text-[var(--oc-blue)]">*</span>
          <input name="last_name" required autoComplete="family-name" className="support-field px-4 text-base" />
        </label>
        <label className="grid gap-2 text-sm font-medium text-[var(--oc-ink)]">
          Company or ownership entity
          <input name="company" autoComplete="organization" className="support-field px-4 text-base" />
        </label>
        <label className="grid gap-2 text-sm font-medium text-[var(--oc-ink)]">
          Email <span className="text-[var(--oc-blue)]">*</span>
          <input name="email" type="email" required autoComplete="email" className="support-field px-4 text-base" />
        </label>
        <label className="grid gap-2 text-sm font-medium text-[var(--oc-ink)]">
          Phone <span className="text-[var(--oc-blue)]">*</span>
          <input name="phone" type="tel" required autoComplete="tel" className="support-field px-4 text-base" />
        </label>
        <label className="grid gap-2 text-sm font-medium text-[var(--oc-ink)]">
          Preferred contact method
          <select name="preferred_contact_method" className="support-field px-4 text-base">
            <option>Email</option>
            <option>Phone</option>
            <option>Either</option>
          </select>
        </label>
      </fieldset>

      <fieldset className="support-form-panel mt-6 grid gap-5 rounded-lg border border-[var(--oc-line)] bg-[var(--oc-ivory)] p-5 md:grid-cols-2">
        <legend className="mb-1 flex items-center gap-2 font-display text-2xl font-bold uppercase text-[var(--oc-ink)] md:col-span-2">
          <Plane className="h-5 w-5 text-[var(--oc-blue)]" />
          Aircraft and timing
        </legend>
        <label className="grid gap-2 text-sm font-medium text-[var(--oc-ink)]">
          Aircraft make
          <input name="aircraft_make" className="support-field px-4 text-base" />
        </label>
        <label className="grid gap-2 text-sm font-medium text-[var(--oc-ink)]">
          Aircraft model
          <input name="aircraft_model" className="support-field px-4 text-base" />
        </label>
        <label className="grid gap-2 text-sm font-medium text-[var(--oc-ink)]">
          Tail number
          <input name="tail_number" className="support-field px-4 text-base uppercase" />
        </label>
        <label className="grid gap-2 text-sm font-medium text-[var(--oc-ink)]">
          Aircraft base
          <input name="aircraft_base" className="support-field px-4 text-base" />
        </label>
        <label className="grid gap-2 text-sm font-medium text-[var(--oc-ink)] md:col-span-2">
          Requested support category <span className="text-[var(--oc-blue)]">*</span>
          <select
            name="requested_service_category"
            value={category}
            onChange={(event) => setCategory(event.target.value as CategoryValue)}
            required
            className="support-field px-4 text-base"
          >
            {categories.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium text-[var(--oc-ink)]">
          Requested timing <span className="text-[var(--oc-blue)]">*</span>
          <input name="requested_timing" required className="support-field px-4 text-base" />
        </label>
        <label className="grid gap-2 text-sm font-medium text-[var(--oc-ink)] md:col-span-2">
          Operational summary <span className="text-[var(--oc-blue)]">*</span>
          <textarea name="operational_summary" required className="support-field min-h-32 px-4 py-3 text-base" />
        </label>
      </fieldset>

      <AnimatePresence mode="wait">
        <motion.section
          key={activeCategory.value}
          aria-live="polite"
          className="support-form-panel mt-6 rounded-lg border border-[var(--oc-line)] bg-[var(--oc-ivory)] p-5 shadow-inner"
          initial={reduce ? false : { opacity: 0, y: 18 }}
          animate={reduce ? undefined : { opacity: 1, y: 0 }}
          exit={reduce ? undefined : { opacity: 0, y: -10 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex flex-col gap-3 border-b border-[var(--oc-line)] pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="oc-kicker text-[0.64rem] text-[var(--oc-blue)]">{activeCategory.label}</p>
              <p className="mt-3 text-sm leading-relaxed text-[var(--oc-muted)]">{activeCategory.help}</p>
            </div>
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[var(--oc-blue)]/30 bg-[var(--oc-blue)]/10 px-3 py-1 text-xs uppercase text-[var(--oc-blue)]">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Info required
            </span>
          </div>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            {activeCategory.fields.map((field) => (
              <Field
                key={field[0]}
                field={field}
                defaultValue={field[0] === "desired_tier" ? initialPlan : undefined}
              />
            ))}
          </div>
        </motion.section>
      </AnimatePresence>

      <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <label className="mt-6 flex items-start gap-3 text-sm leading-relaxed text-[var(--oc-muted)]">
        <input name="acknowledgment" value="accepted" type="checkbox" required className="mt-1 h-4 w-4 accent-[var(--primary)]" />
        <span>
          I acknowledge AMG&apos;s privacy, terms, and operational disclaimer language. I understand a submitted request is not mission acceptance, crew confirmation, aircraft availability, or a binding quote.
        </span>
      </label>
      <p className="mt-5 text-xs leading-relaxed text-[var(--oc-muted)]">{COMPANY.requestDisclaimer}</p>
      <SubmitRequestButton />
      </div>
    </form>
  );
}
