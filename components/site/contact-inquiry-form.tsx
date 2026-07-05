"use client";

import Link from "next/link";
import { useFormStatus } from "react-dom";
import { CheckCircle2, Send } from "lucide-react";
import { submitContactInquiry } from "@/app/(public)/contact/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SafeErrorMessage } from "@/components/ui/safe-error-message";
import { contactInquiryTypes } from "@/lib/public-form-options";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="min-h-11 rounded-full bg-[var(--oc-blue)] px-6 text-white hover:bg-[var(--oc-navy)]">
      {pending ? "Sending..." : "Send general inquiry"}
      <Send className="h-4 w-4" />
    </Button>
  );
}

function Field({
  label,
  id,
  children,
  required,
}: {
  label: string;
  id: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id} className="text-sm font-semibold text-[var(--oc-ink)]">
        {label}
        {required ? <span className="text-[var(--oc-blue)]">*</span> : null}
      </Label>
      {children}
    </div>
  );
}

export function ContactInquiryForm({
  success,
  error,
}: {
  success?: string;
  error?: string;
}) {
  return (
    <Card className="oc-card rounded-2xl border-[var(--oc-line)] p-0">
      <CardHeader className="px-6 pt-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="oc-eyebrow text-[var(--oc-blue)]">General inquiry</p>
            <CardTitle className="oc-display mt-3 text-3xl text-[var(--oc-ink)]">Send AMG a message</CardTitle>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--oc-muted)]">
              AMG will route your message to the appropriate team. Aircraft support requests require the dedicated support form.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        {success ? (
          <div role="status" className="mb-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm leading-relaxed text-emerald-900">
            <div className="flex gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Inquiry received. AMG will review the submitted details and route the request appropriately.</span>
            </div>
          </div>
        ) : null}
        {error ? (
          error === "missing" ? (
            <div role="alert" className="mb-5 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm leading-relaxed text-red-900">
              Complete the required fields and confirm the acknowledgment before submitting.
            </div>
          ) : error === "payment-data" ? (
            <div role="alert" className="mb-5 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm leading-relaxed text-red-900">
              Remove full card numbers, CVV codes, bank account numbers, or routing numbers before submitting. AMG does not process payment card or bank account payments through this website or portal.
            </div>
          ) : (
            <SafeErrorMessage area="public_contact" action="submit" className="mb-5 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm leading-relaxed text-red-900" />
          )
        ) : null}
        <form action={submitContactInquiry} className="grid gap-5 text-[var(--oc-ink)]">
          <input id="contact-website" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
          <div className="grid gap-5 md:grid-cols-2">
            <Field id="contact-full-name" label="Full name" required>
              <Input id="contact-full-name" name="full_name" required autoComplete="name" className="min-h-11 bg-[#0A1322]/85" />
            </Field>
            <Field id="contact-email" label="Email" required>
              <Input id="contact-email" name="email" type="email" required autoComplete="email" className="min-h-11 bg-[#0A1322]/85" />
            </Field>
            <Field id="contact-company" label="Company / operator">
              <Input id="contact-company" name="company_operator" autoComplete="organization" className="min-h-11 bg-[#0A1322]/85" />
            </Field>
            <Field id="contact-phone" label="Phone">
              <Input id="contact-phone" name="phone" type="tel" autoComplete="tel" className="min-h-11 bg-[#0A1322]/85" />
            </Field>
            <Field id="contact-inquiry-type" label="Inquiry type" required>
              <select
                id="contact-inquiry-type"
                name="inquiry_type"
                required
                className="support-field min-h-11 bg-[#0A1322]/85 px-3 text-sm"
              >
                {contactInquiryTypes.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field id="contact-message" label="Message" required>
            <Textarea id="contact-message" name="message" required className="min-h-36 bg-[#0A1322]/85" />
          </Field>
          <p className="rounded-xl border border-[var(--oc-line)] bg-[#0A1322]/85 p-4 text-sm leading-relaxed text-[var(--oc-muted)]">
            Do not enter full credit card numbers, CVV codes, bank account numbers, or routing numbers. AMG does not
            process payment card or bank account payments through this website or portal.
          </p>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex items-start gap-3 rounded-xl border border-[var(--oc-line)] bg-[#0A1322]/85 p-4 text-sm leading-relaxed text-[var(--oc-muted)]">
              <input name="marketing_consent" value="true" type="checkbox" className="mt-1 h-4 w-4 accent-[var(--oc-blue)]" />
              <span>AMG may email me relevant updates about aviation support services.</span>
            </label>
            <label className="flex items-start gap-3 rounded-xl border border-[var(--oc-line)] bg-[#0A1322]/85 p-4 text-sm leading-relaxed text-[var(--oc-muted)]">
              <input name="sms_consent" value="true" type="checkbox" className="mt-1 h-4 w-4 accent-[var(--oc-blue)]" />
              <span>AMG may text me about this inquiry. Message and data rates may apply.</span>
            </label>
          </div>

          <label className="flex items-start gap-3 rounded-xl border border-[var(--oc-line)] bg-[var(--oc-ivory)] p-4 text-sm leading-relaxed text-[var(--oc-muted)]">
            <input name="acknowledgment" value="accepted" type="checkbox" required className="mt-1 h-4 w-4 accent-[var(--oc-blue)]" />
            <span>
              By submitting this form, I agree to AMG routing my message and contacting me about this inquiry. I have reviewed the <Link href="/privacy-policy" className="font-semibold text-[var(--oc-blue)] hover:text-[var(--oc-navy)]">Privacy Policy</Link> and <Link href="/terms" className="font-semibold text-[var(--oc-blue)] hover:text-[var(--oc-navy)]">Terms</Link>.
            </span>
          </label>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <SubmitButton />
            <Link href="/booking-request" prefetch={false} className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--oc-blue)] hover:text-[var(--oc-navy)]">
              Need aircraft support?
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
