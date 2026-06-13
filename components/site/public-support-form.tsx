"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Send } from "lucide-react";
import { submitPublicSupportRequest } from "@/app/(public)/contact/actions";
import { COMPANY } from "@/lib/content";

const categories = [
  {
    value: "aircraft-management-support",
    label: "Aircraft Management Support",
    help: "For recurring owner, records, scheduling, crew, and aircraft-support administration.",
    fields: [
      ["ownership_entity", "Ownership or operating entity", "text", true],
      ["current_crew_arrangement", "Current crew arrangement", "text", true],
      ["existing_management_arrangement", "Existing management arrangement", "text", false],
      ["maintenance_tracking_system", "Maintenance tracking system", "text", false],
      ["scheduling_expectations", "Scheduling expectations", "textarea", true],
      ["records_status", "Records status", "textarea", false],
      ["accounting_support_requirements", "Accounting support requirements", "textarea", false],
      ["desired_management_scope", "Desired management scope", "textarea", true],
      ["anticipated_start_date", "Anticipated start date", "date", false],
      ["number_of_aircraft", "Number of aircraft", "number", true],
      ["current_operational_concerns", "Current operational concerns", "textarea", false],
    ],
  },
  {
    value: "contract-pilot-support",
    label: "Contract Pilot Support",
    help: "For PIC, SIC, or two-pilot support tied to a specific aircraft, date, route, or coverage need.",
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
      ["special_mission_notes", "Special mission notes", "textarea", false],
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
    help: "For maintenance positioning, return-to-service, functional-check, or acceptance-flight support.",
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
    label: "Flight Operations Coordination",
    help: "For mission intake, crew logistics, vendor communication, travel, lodging, and operational updates.",
    fields: [
      ["mission_dates", "Mission dates", "text", true],
      ["origin_destination", "Origin and destination", "text", true],
      ["number_of_passengers", "Number of passengers", "number", false],
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
    label: "Fleet Support Program",
    help: "For multi-aircraft or recurring operating support programs.",
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
    label: "Subscription Program Inquiry",
    help: "For aircraft-class, billing, allowance, tier, travel, lodging, and proposal questions.",
    fields: [
      ["aircraft_category", "Aircraft category", "text", true],
      ["single_or_two_pilot", "Single-pilot or two-pilot requirement", "text", true],
      ["preferred_billing", "Preferred monthly or annual billing", "text", true],
      ["expected_client_flight_duty_days", "Expected client-flight duty days", "number", false],
      ["expected_mx_movements", "Expected MX movements", "number", false],
      ["domestic_or_international_activity", "Domestic or international activity", "text", false],
      ["expected_overnight_frequency", "Expected overnight frequency", "text", false],
      ["travel_lodging_preference", "Travel/lodging preference", "textarea", false],
      ["desired_tier", "Desired tier", "text", false],
      ["expected_start_date", "Expected start date", "date", false],
      ["questions_or_special_requirements", "Questions or special requirements", "textarea", false],
    ],
  },
  {
    value: "other-support",
    label: "Other Support",
    help: "For support needs that do not fit the standard categories.",
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
      className="magnetic-link mt-6 inline-flex min-h-12 items-center gap-2 rounded-full bg-primary px-8 py-4 font-display text-sm font-semibold uppercase tracking-widest text-primary-foreground shadow-[0_18px_54px_rgba(59,130,246,0.24)] transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
      data-cursor="SUBMIT"
    >
      {pending ? "Submitting..." : "Start Support Request"}
      <Send className="h-4 w-4" />
    </button>
  );
}

function Field({ field }: { field: FieldConfig }) {
  const [name, label, type, required] = field;
  const common =
    "support-field px-4 text-base";

  return (
    <label className="grid gap-2 text-sm font-medium text-foreground/90">
      <span>
        {label}
        {required ? <span className="text-accent"> *</span> : null}
      </span>
      {type === "textarea" ? (
        <textarea name={name} required={required} className={`${common} min-h-28 py-3`} data-cursor="TYPE" />
      ) : (
        <input name={name} type={type} required={required} className={common} data-cursor="TYPE" />
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
  success,
  error,
  duplicate,
}: {
  initialCategory?: string;
  success?: string;
  error?: string;
  duplicate?: string;
}) {
  const [category, setCategory] = useState<CategoryValue>(normalizeCategory(initialCategory) as CategoryValue);
  const activeCategory = useMemo(
    () => categories.find((item) => item.value === category) ?? categories[0],
    [category]
  );

  return (
    <form action={submitPublicSupportRequest} className="support-form glass-panel rounded-lg p-6 lg:p-8" data-scroll-animate>
      {success ? (
        <div role="status" className="mb-5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm leading-relaxed text-emerald-200">
          Support request {success} was submitted. AMG Operations will review it before any acceptance or coordination is confirmed.
          {duplicate ? " We found a matching recent request and returned the existing reference." : ""}
        </div>
      ) : null}
      {error ? (
        <div role="alert" className="mb-5 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm leading-relaxed text-red-200">
          {error === "missing"
            ? "Please complete the required fields and accept the privacy and terms acknowledgment."
            : "The request could not be submitted. Please try again or email AMG Operations directly."}
        </div>
      ) : null}

      <fieldset className="grid gap-5 md:grid-cols-2">
        <legend className="sr-only">Contact information</legend>
        <label className="grid gap-2 text-sm font-medium text-foreground/90">
          First name <span className="sr-only">required</span>
          <input name="first_name" required autoComplete="given-name" className="support-field px-4 text-base" data-cursor="TYPE" />
        </label>
        <label className="grid gap-2 text-sm font-medium text-foreground/90">
          Last name <span className="sr-only">required</span>
          <input name="last_name" required autoComplete="family-name" className="support-field px-4 text-base" data-cursor="TYPE" />
        </label>
        <label className="grid gap-2 text-sm font-medium text-foreground/90">
          Company or ownership entity
          <input name="company" autoComplete="organization" className="support-field px-4 text-base" data-cursor="TYPE" />
        </label>
        <label className="grid gap-2 text-sm font-medium text-foreground/90">
          Email <span className="text-accent">*</span>
          <input name="email" type="email" required autoComplete="email" className="support-field px-4 text-base" data-cursor="TYPE" />
        </label>
        <label className="grid gap-2 text-sm font-medium text-foreground/90">
          Phone <span className="text-accent">*</span>
          <input name="phone" type="tel" required autoComplete="tel" className="support-field px-4 text-base" data-cursor="TYPE" />
        </label>
        <label className="grid gap-2 text-sm font-medium text-foreground/90">
          Preferred contact method
          <select name="preferred_contact_method" className="support-field px-4 text-base" data-cursor="TYPE">
            <option>Email</option>
            <option>Phone</option>
            <option>Either</option>
          </select>
        </label>
      </fieldset>

      <fieldset className="mt-8 grid gap-5 border-t border-white/10 pt-8 md:grid-cols-2">
        <legend className="mb-1 font-display text-2xl font-bold uppercase tracking-wide text-foreground">
          Aircraft and Timing
        </legend>
        <label className="grid gap-2 text-sm font-medium text-foreground/90">
          Aircraft make
          <input name="aircraft_make" className="support-field px-4 text-base" data-cursor="TYPE" />
        </label>
        <label className="grid gap-2 text-sm font-medium text-foreground/90">
          Aircraft model
          <input name="aircraft_model" className="support-field px-4 text-base" data-cursor="TYPE" />
        </label>
        <label className="grid gap-2 text-sm font-medium text-foreground/90">
          Tail number
          <input name="tail_number" className="support-field px-4 text-base uppercase" data-cursor="TYPE" />
        </label>
        <label className="grid gap-2 text-sm font-medium text-foreground/90">
          Aircraft base
          <input name="aircraft_base" className="support-field px-4 text-base" data-cursor="TYPE" />
        </label>
        <label className="grid gap-2 text-sm font-medium text-foreground/90 md:col-span-2">
          Requested service category <span className="text-accent">*</span>
          <select
            name="requested_service_category"
            value={category}
            onChange={(event) => setCategory(event.target.value as CategoryValue)}
            required
            className="support-field px-4 text-base"
            data-cursor="TYPE"
          >
            {categories.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium text-foreground/90">
          Requested timing <span className="text-accent">*</span>
          <input name="requested_timing" required className="support-field px-4 text-base" data-cursor="TYPE" />
        </label>
        <label className="grid gap-2 text-sm font-medium text-foreground/90 md:col-span-2">
          Operational summary <span className="text-accent">*</span>
          <textarea name="operational_summary" required className="support-field min-h-32 px-4 py-3 text-base" data-cursor="TYPE" />
        </label>
      </fieldset>

      <AnimatePresence mode="wait">
        <motion.section
          key={activeCategory.value}
          aria-live="polite"
          className="mt-8 rounded-lg border border-white/10 bg-background/40 p-5 shadow-inner"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="eyebrow text-[0.68rem] text-accent">{activeCategory.label}</p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{activeCategory.help}</p>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            {activeCategory.fields.map((field) => (
              <Field key={field[0]} field={field} />
            ))}
          </div>
        </motion.section>
      </AnimatePresence>

      <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <label className="mt-6 flex items-start gap-3 text-sm leading-relaxed text-muted-foreground">
        <input name="acknowledgment" value="accepted" type="checkbox" required className="mt-1 h-4 w-4 accent-[var(--accent)]" />
        <span>
          I acknowledge AMG&apos;s privacy, terms, and operational disclaimer language. I understand a submitted request is not mission acceptance, crew confirmation, aircraft availability, or a binding quote.
        </span>
      </label>
      <p className="mt-5 text-xs leading-relaxed text-muted-foreground">{COMPANY.requestDisclaimer}</p>
      <SubmitRequestButton />
    </form>
  );
}
