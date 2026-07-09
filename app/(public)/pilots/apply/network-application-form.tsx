"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";

const certificateOptions = ["Private Pilot", "Commercial Pilot", "ATP", "CFI", "CFII", "MEI", "Remote Pilot", "Other"];
const ratingOptions = ["Instrument", "Multi-Engine Land", "Multi-Engine Sea", "Single-Engine Land", "Single-Engine Sea", "Type Rating(s)", "Other"];
const assignmentOptions = ["Contract pilot", "Ferry / aircraft movement", "Maintenance repositioning", "Owner trip support", "SIC support", "PIC support", "Last-minute coverage", "Recurrent / recurring support"];

type Errors = Record<string, string>;

function Field({
  label,
  name,
  children,
  error,
  required,
}: {
  label: string;
  name: string;
  children: React.ReactNode;
  error?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-[0.75rem] font-bold uppercase [letter-spacing:0.16em] text-[var(--oc-aluminum)]">
        {label}
        {required ? <span className="ml-1 text-[var(--oc-blue)]">*</span> : null}
      </span>
      {children}
      {error ? <span className="text-xs font-medium text-red-200">{error}</span> : null}
    </label>
  );
}

function inputClass(error?: string) {
  return [
    // text-base (16px) avoids iOS Safari's focus auto-zoom on form fields.
    // `.support-field` carries the shared token styling (border/bg/focus ring);
    // `!border-red-400` forces the error state to win over that base rule.
    "support-field w-full px-3 text-base",
    error ? "!border-red-400" : "",
  ].join(" ");
}

function Checklist({
  name,
  options,
  error,
}: {
  name: string;
  options: string[];
  error?: string;
}) {
  return (
    <div>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((option) => (
          <label key={option} className="flex items-center gap-3 rounded-lg border border-[var(--oc-line-dark)] bg-white/[0.03] px-3 py-2.5 text-sm text-[var(--oc-aluminum)] transition hover:border-[var(--oc-blue)]">
            <input type="checkbox" name={name} value={option} className="h-4 w-4 accent-[var(--oc-blue)]" />
            <span>{option}</span>
          </label>
        ))}
      </div>
      {error ? <p className="mt-2 text-xs font-medium text-red-200">{error}</p> : null}
    </div>
  );
}

function Section({ index, title, children }: { index: number; title: string; children: React.ReactNode }) {
  return (
    <section className="group hud-frame oc-card-dark p-6 sm:p-7" data-scroll-animate>
      <span className="font-mono text-[10px] [letter-spacing:0.16em] text-[var(--amber)]">
        {String(index).padStart(2, "0")}
      </span>
      <h2 className="oc-display mt-2 text-xl text-[var(--oc-paper)]">{title}</h2>
      <div className="pub-rule mt-3" aria-hidden="true" />
      <div className="mt-5 grid gap-4 lg:grid-cols-2">{children}</div>
    </section>
  );
}

export function NetworkApplicationForm() {
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [success, setSuccess] = useState(false);
  const formId = useMemo(() => `network-application-${Date.now()}`, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setErrors({});
    const formData = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/crew-network/applications", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.ok) {
        setErrors(payload.errors ?? { form: "Application could not be submitted." });
        return;
      }
      setSuccess(true);
      event.currentTarget.reset();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setErrors({ form: "Application could not be submitted. Please try again." });
    } finally {
      setPending(false);
    }
  }

  if (success) {
    return (
      <div className="pub-card-hover hud-frame oc-card-dark p-8">
        <CheckCircle2 className="h-10 w-10 text-[var(--oc-blue)]" />
        <h2 className="oc-display mt-5 text-3xl text-[var(--oc-paper)]">Application received.</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--oc-aluminum)]">
          AMG will review your submission and contact you if additional information is required.
        </p>
        <Link href="/pilots" className="oc-btn oc-btn-primary mt-6">
          Back to the Pilot Network
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <form id={formId} onSubmit={submit} className="grid gap-6" encType="multipart/form-data" noValidate>
      {/* Honeypot: real applicants never see or fill this; a value flags a bot
          (checked server-side in the crew-network route). */}
      <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

      {errors.form ? (
        <div role="alert" className="rounded-lg border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {errors.form}
        </div>
      ) : null}

      <Section index={1} title="Applicant Identity">
        <Field label="Full name" name="full_name" required error={errors.full_name}>
          <input name="full_name" required className={inputClass(errors.full_name)} />
        </Field>
        <Field label="Email" name="email" required error={errors.email}>
          <input name="email" type="email" required className={inputClass(errors.email)} />
        </Field>
        <Field label="Phone number" name="phone" required error={errors.phone}>
          <input name="phone" required className={inputClass(errors.phone)} />
        </Field>
        <Field label="Home airport" name="home_airport" required error={errors.home_airport}>
          <input name="home_airport" required placeholder="KTEB, TEB, or airport name" className={inputClass(errors.home_airport)} onInput={(event) => {
            const target = event.currentTarget;
            if (/^[a-z0-9]{0,4}$/i.test(target.value)) target.value = target.value.toUpperCase();
          }} />
        </Field>
        <Field label="Closest major airport" name="closest_major_airport" required error={errors.closest_major_airport}>
          <input name="closest_major_airport" required placeholder="KPBI, PBI, or airport name" className={inputClass(errors.closest_major_airport)} onInput={(event) => {
            const target = event.currentTarget;
            if (/^[a-z0-9]{0,4}$/i.test(target.value)) target.value = target.value.toUpperCase();
          }} />
        </Field>
        <Field label="Commute time to closest major airport" name="commute_time" required error={errors.commute_time}>
          <select name="commute_time" required defaultValue="" className={inputClass(errors.commute_time)}>
            <option value="" disabled>Select commute time</option>
            {["Under 30 minutes", "30-60 minutes", "1-2 hours", "2+ hours"].map((item) => <option key={item}>{item}</option>)}
          </select>
        </Field>
        <Field label="Minimum call time" name="minimum_call_time" required error={errors.minimum_call_time}>
          <select name="minimum_call_time" required defaultValue="" className={inputClass(errors.minimum_call_time)}>
            <option value="" disabled>Select call time</option>
            {["2 hours", "4 hours", "8 hours", "12 hours", "24 hours", "48 hours", "Other"].map((item) => <option key={item}>{item}</option>)}
          </select>
        </Field>
      </Section>

      <Section index={2} title="Pilot Qualifications">
        {[
          ["Total flight time", "total_time", true],
          ["Total PIC time", "pic_time", false],
          ["Total SIC time", "sic_time", false],
          ["Multi-engine time", "multi_engine_time", false],
          ["Turbine time", "turbine_time", false],
          ["Jet time", "jet_time", false],
          ["Instrument time", "instrument_time", false],
          ["Flight time — last 90 days", "hours_last_90_days", true],
          ["Desired day rate", "desired_day_rate", false],
        ].map(([label, name, required]) => (
          <Field key={String(name)} label={String(label)} name={String(name)} required={Boolean(required)} error={errors[String(name)]}>
            <input name={String(name)} type="number" min="0" step="0.1" required={Boolean(required)} className={inputClass(errors[String(name)])} />
          </Field>
        ))}
        <div className="lg:col-span-2">
          <Field label="Pilot certificates held" name="certificates_held" required error={errors.certificates_held}>
            <Checklist name="certificates_held" options={certificateOptions} error={errors.certificates_held} />
          </Field>
        </div>
        <div className="lg:col-span-2">
          <Field label="Ratings held" name="ratings_held" required error={errors.ratings_held}>
            <Checklist name="ratings_held" options={ratingOptions} error={errors.ratings_held} />
          </Field>
        </div>
        <Field label="Type ratings / aircraft qualified" name="type_ratings">
          <input name="type_ratings" placeholder="CE-525, CE-560XL, HS-125, CL-350, G-IV, etc." className={inputClass()} />
        </Field>
        <Field label="Current medical certificate" name="medical_certificate" required error={errors.medical_certificate}>
          <select name="medical_certificate" required defaultValue="" className={inputClass(errors.medical_certificate)}>
            <option value="" disabled>Select medical certificate</option>
            {["First Class", "Second Class", "Third Class", "BasicMed", "None / expired"].map((item) => <option key={item}>{item}</option>)}
          </select>
        </Field>
        <Field label="Medical expiration date" name="medical_expiration_date">
          <input name="medical_expiration_date" type="date" className={inputClass()} />
        </Field>
        <Field label="Work authorization / citizenship status" name="work_authorization_status" required error={errors.work_authorization_status}>
          <select name="work_authorization_status" required defaultValue="" className={inputClass(errors.work_authorization_status)}>
            <option value="" disabled>Select status</option>
            {["U.S. citizen", "U.S. permanent resident", "Authorized to work in the United States", "Requires sponsorship or additional authorization", "Prefer to discuss"].map((item) => <option key={item}>{item}</option>)}
          </select>
        </Field>
        <Field label="Passport available" name="passport_available">
          <select name="passport_available" defaultValue="" className={inputClass()}>
            <option value="">Prefer not to answer</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </Field>
        <Field label="Able to support international operations" name="international_ops">
          <select name="international_ops" defaultValue="" className={inputClass()}>
            <option value="">Prefer not to answer</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </Field>
        <div className="lg:col-span-2">
          <Field label="Preferred assignment types" name="preferred_assignment_types">
            <Checklist name="preferred_assignment_types" options={assignmentOptions} />
          </Field>
        </div>
        <div className="lg:col-span-2">
          <Field label="Additional notes" name="additional_notes">
            <textarea name="additional_notes" rows={5} className={inputClass()} />
          </Field>
        </div>
      </Section>

      <Section index={3} title="Insurance History & References">
        <Field
          label="Any accidents, incidents, or FAA enforcement actions?"
          name="insurance_incidents"
          required
          error={errors.insurance_incidents}
        >
          <select name="insurance_incidents" required defaultValue="" className={inputClass(errors.insurance_incidents)}>
            <option value="" disabled>Select…</option>
            <option value="No">No</option>
            <option value="Yes — explained below">Yes — explained below</option>
          </select>
        </Field>
        <Field
          label="Ever denied coverage, or added with special conditions, by an aircraft insurer?"
          name="insurance_denied"
          required
          error={errors.insurance_denied}
        >
          <select name="insurance_denied" required defaultValue="" className={inputClass(errors.insurance_denied)}>
            <option value="" disabled>Select…</option>
            <option value="No">No</option>
            <option value="Yes — explained below">Yes — explained below</option>
          </select>
        </Field>
        <div className="lg:col-span-2">
          <Field label="Details (if you answered yes above)" name="insurance_incident_details">
            <textarea name="insurance_incident_details" rows={3} className={inputClass()} />
          </Field>
        </div>
        <Field label="Reference 1 — name, relationship, phone or email" name="reference_1" required error={errors.reference_1}>
          <input name="reference_1" required placeholder="e.g. Jane Doe, chief pilot, (555) 000-0000" className={inputClass(errors.reference_1)} />
        </Field>
        <Field label="Reference 2 — name, relationship, phone or email" name="reference_2">
          <input name="reference_2" placeholder="Optional but speeds up review" className={inputClass()} />
        </Field>
      </Section>

      <Section index={4} title="Documents">
        <Field label="Resume upload" name="resume" required error={errors.resume}>
          <input name="resume" type="file" required accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className={inputClass(errors.resume)} />
        </Field>
        <Field label="Certificates upload" name="certificates" error={errors.certificates}>
          <input name="certificates" type="file" multiple accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" className={inputClass(errors.certificates)} />
        </Field>
        <div className="lg:col-span-2">
          <Field label="Additional supporting documents" name="supporting_documents" error={errors.supporting_documents}>
            <input name="supporting_documents" type="file" multiple accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" className={inputClass(errors.supporting_documents)} />
          </Field>
        </div>
      </Section>

      <section className="oc-card-dark p-6" data-scroll-animate>
        <div className="space-y-3">
          <label className="flex items-start gap-3 text-sm leading-6 text-[var(--oc-aluminum)]">
            <input type="checkbox" name="legal_acknowledgment" value="accepted" required className="mt-1 h-4 w-4 accent-[var(--oc-blue)]" />
            <span>I understand that submitting this application does not create employment, contractor status, assignment acceptance, aircraft approval, operator approval, or guaranteed compensation. I agree that AMG Aviation Group may review and store this information for crew-network evaluation, may contact the references I provided, and may verify the credentials and history in this application.</span>
          </label>
          {errors.legal_acknowledgment ? <p className="text-xs text-red-200">{errors.legal_acknowledgment}</p> : null}
          <label className="flex items-start gap-3 text-sm leading-6 text-[var(--oc-aluminum)]">
            <input type="checkbox" name="policy_acknowledgment" value="accepted" required className="mt-1 h-4 w-4 accent-[var(--oc-blue)]" />
            <span>
              I have reviewed the{" "}
              <Link href="/credential-submission" className="font-semibold text-[var(--oc-blue)] hover:underline">Credential Submission Notice</Link>,{" "}
              <Link href="/privacy-policy" className="font-semibold text-[var(--oc-blue)] hover:underline">Privacy Policy</Link>, and{" "}
              <Link href="/terms" className="font-semibold text-[var(--oc-blue)] hover:underline">Terms & Conditions</Link>.
            </span>
          </label>
          {errors.policy_acknowledgment ? <p className="text-xs text-red-200">{errors.policy_acknowledgment}</p> : null}
        </div>
      </section>

      <div className="sticky bottom-4 z-10 flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="oc-btn oc-btn-primary disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {pending ? "Submitting..." : "Submit Application"}
        </button>
      </div>
    </form>
  );
}
