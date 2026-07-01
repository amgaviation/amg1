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
      <span className="text-[0.66rem] font-bold uppercase tracking-[0.18em] text-[#C0C7D1]">
        {label}
        {required ? <span className="ml-1 text-[#3B82F6]">*</span> : null}
      </span>
      {children}
      {error ? <span className="text-xs font-medium text-red-200">{error}</span> : null}
    </label>
  );
}

function inputClass(error?: string) {
  return [
    "min-h-12 rounded-lg border bg-white/[0.055] px-3 text-sm text-white outline-none transition placeholder:text-[#9CA3AF]/60",
    error ? "border-red-300/70" : "border-white/15 focus:border-[#3B82F6] focus:shadow-[0_0_0_3px_rgba(59,130,246,0.18)]",
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
          <label key={option} className="flex items-center gap-3 rounded-lg border border-white/12 bg-white/[0.045] px-3 py-2.5 text-sm text-[#C0C7D1]">
            <input type="checkbox" name={name} value={option} className="h-4 w-4 accent-[#3B82F6]" />
            <span>{option}</span>
          </label>
        ))}
      </div>
      {error ? <p className="mt-2 text-xs font-medium text-red-200">{error}</p> : null}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-white/12 bg-white/[0.055] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl">
      <h2 className="font-display text-xl font-extrabold uppercase text-white">{title}</h2>
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
      <div className="rounded-xl border border-[#3B82F6]/40 bg-[#07111F]/90 p-8 text-white shadow-[0_28px_90px_rgba(0,0,0,0.34)]">
        <CheckCircle2 className="h-10 w-10 text-[#3B82F6]" />
        <h2 className="mt-5 font-display text-3xl font-extrabold uppercase">Application received.</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[#C0C7D1]">
          AMG will review your submission and contact you if additional information is required.
        </p>
        <Link href="/crew-network" className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#3B82F6] px-5 py-3 text-sm font-bold text-white">
          Return to Crew Network
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <form id={formId} onSubmit={submit} className="space-y-6" encType="multipart/form-data" noValidate>
      {errors.form ? (
        <div role="alert" className="rounded-lg border border-red-300/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {errors.form}
        </div>
      ) : null}

      <Section title="Applicant Identity">
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

      <Section title="Pilot Qualifications">
        {[
          ["Total flight time", "total_time", true],
          ["Total PIC time", "pic_time", false],
          ["Total SIC time", "sic_time", false],
          ["Multi-engine time", "multi_engine_time", false],
          ["Turbine time", "turbine_time", false],
          ["Jet time", "jet_time", false],
          ["Instrument time", "instrument_time", false],
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

      <Section title="Documents">
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

      <section className="rounded-xl border border-white/12 bg-white/[0.055] p-5">
        <div className="space-y-3">
          <label className="flex items-start gap-3 text-sm leading-6 text-[#C0C7D1]">
            <input type="checkbox" name="legal_acknowledgment" value="accepted" required className="mt-1 h-4 w-4 accent-[#3B82F6]" />
            <span>I understand that submitting this application does not create employment, contractor status, assignment acceptance, aircraft approval, operator approval, or guaranteed compensation. I agree that AMG Aviation Group may review and store this information for crew-network evaluation.</span>
          </label>
          {errors.legal_acknowledgment ? <p className="text-xs text-red-200">{errors.legal_acknowledgment}</p> : null}
          <label className="flex items-start gap-3 text-sm leading-6 text-[#C0C7D1]">
            <input type="checkbox" name="policy_acknowledgment" value="accepted" required className="mt-1 h-4 w-4 accent-[#3B82F6]" />
            <span>
              I have reviewed the{" "}
              <Link href="/credential-submission" className="font-semibold text-[#3B82F6] hover:underline">Credential Submission Notice</Link>,{" "}
              <Link href="/privacy-policy" className="font-semibold text-[#3B82F6] hover:underline">Privacy Policy</Link>, and{" "}
              <Link href="/terms" className="font-semibold text-[#3B82F6] hover:underline">Terms & Conditions</Link>.
            </span>
          </label>
          {errors.policy_acknowledgment ? <p className="text-xs text-red-200">{errors.policy_acknowledgment}</p> : null}
        </div>
      </section>

      <div className="sticky bottom-4 z-10 flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#3B82F6] px-6 text-sm font-bold text-white shadow-[0_18px_45px_rgba(59,130,246,0.32)] transition hover:bg-[#2563EB] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {pending ? "Submitting..." : "Submit Application"}
        </button>
      </div>
    </form>
  );
}
