"use client";

import { useState } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { ArrowRight, CheckCircle2, Send } from "lucide-react";
import { submitContactInquiry } from "@/app/(public)/contact/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SafeErrorMessage } from "@/components/ui/safe-error-message";
import { contactInquiryTypes, preferredContactMethods } from "@/lib/public-form-options";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="min-h-11 rounded-full bg-[var(--oc-blue)] px-6 text-white hover:bg-[var(--oc-navy)]">
      {pending ? "Sending..." : "Submit Inquiry"}
      <Send className="h-4 w-4" />
    </Button>
  );
}

function Field({
  label,
  children,
  required,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="grid gap-2">
      <Label className="text-sm font-semibold text-[var(--oc-ink)]">
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
  const [inquiryType, setInquiryType] = useState("General Inquiry");

  return (
    <Card className="oc-card rounded-2xl border-[var(--oc-line)] p-0">
      <CardHeader className="px-6 pt-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="oc-eyebrow text-[var(--oc-blue)]">General Inquiry</p>
            <CardTitle className="oc-display mt-3 text-3xl text-[var(--oc-ink)]">Send AMG a message</CardTitle>
          </div>
          <Badge variant="outline" className="border-[var(--oc-line)] bg-white/70 text-[var(--oc-ink)]">
            Source: Contact
          </Badge>
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
          <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Full Name" required>
              <Input name="full_name" required autoComplete="name" className="min-h-11 bg-white/80" />
            </Field>
            <Field label="Email" required>
              <Input name="email" type="email" required autoComplete="email" className="min-h-11 bg-white/80" />
            </Field>
            <Field label="Phone" required>
              <Input name="phone" type="tel" required autoComplete="tel" className="min-h-11 bg-white/80" />
            </Field>
            <Field label="Company / Operator">
              <Input name="company_operator" autoComplete="organization" className="min-h-11 bg-white/80" />
            </Field>
            <Field label="Preferred Contact Method">
              <select name="preferred_contact_method" className="support-field min-h-11 bg-white/80 px-3 text-sm">
                {preferredContactMethods.map((method) => (
                  <option key={method.value} value={method.value}>{method.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Inquiry Type" required>
              <select
                name="inquiry_type"
                required
                value={inquiryType}
                onChange={(event) => setInquiryType(event.target.value)}
                className="support-field min-h-11 bg-white/80 px-3 text-sm"
              >
                {contactInquiryTypes.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </Field>
          </div>

          {inquiryType === "Aircraft Support Question" ? (
            <div className="rounded-xl border border-[var(--oc-line)] bg-[var(--oc-ivory)] p-4">
              <p className="text-sm leading-relaxed text-[var(--oc-muted)]">
                Need to request aircraft movement, crew coordination, maintenance repositioning, or mission-specific
                support? Use the Start Inquiry page so AMG receives the required operational context.
              </p>
              <Button asChild variant="outline" className="mt-4 min-h-11 rounded-full">
                <Link href="/contact?source=homepage" prefetch={false}>
                  Start Inquiry
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          ) : null}

          <Field label="Message" required>
            <Textarea name="message" required className="min-h-36 bg-white/80" />
          </Field>
          <p className="rounded-xl border border-[var(--oc-line)] bg-white/70 p-4 text-sm leading-relaxed text-[var(--oc-muted)]">
            Do not enter full credit card numbers, CVV codes, bank account numbers, or routing numbers. AMG does not
            process payment card or bank account payments through this website or portal.
          </p>

          <label className="flex items-start gap-3 rounded-xl border border-[var(--oc-line)] bg-[var(--oc-ivory)] p-4 text-sm leading-relaxed text-[var(--oc-muted)]">
            <input name="acknowledgment" value="accepted" type="checkbox" required className="mt-1 h-4 w-4 accent-[var(--oc-blue)]" />
            <span>
              I understand that submitting this contact form does not confirm support acceptance, crew availability,
              aircraft movement, or operational approval. I have reviewed the <Link href="/privacy-policy" className="font-semibold text-[var(--oc-blue)] hover:text-[var(--oc-navy)]">Privacy Policy</Link> and <Link href="/terms" className="font-semibold text-[var(--oc-blue)] hover:text-[var(--oc-navy)]">Terms</Link>.
            </span>
          </label>

          <label className="flex items-start gap-3 rounded-xl border border-[var(--oc-line)] bg-white/70 p-4 text-sm leading-relaxed text-[var(--oc-muted)]">
            <input name="marketing_consent" value="yes" type="checkbox" className="mt-1 h-4 w-4 accent-[var(--oc-blue)]" />
            <span>
              I agree to receive optional AMG email updates. Transactional emails about this inquiry may still be sent
              without marketing consent. See the <Link href="/legal/email-communications" className="font-semibold text-[var(--oc-blue)] hover:text-[var(--oc-navy)]">Email Communications Notice</Link>.
            </span>
          </label>

          <label className="flex items-start gap-3 rounded-xl border border-[var(--oc-line)] bg-white/70 p-4 text-sm leading-relaxed text-[var(--oc-muted)]">
            <input name="sms_consent" value="yes" type="checkbox" className="mt-1 h-4 w-4 accent-[var(--oc-blue)]" />
            <span>
              I agree to receive optional AMG text messages about this inquiry or related operational administration.
              Message and data rates may apply. See the <Link href="/legal/sms-terms" className="font-semibold text-[var(--oc-blue)] hover:text-[var(--oc-navy)]">SMS Terms</Link>.
            </span>
          </label>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <SubmitButton />
            <Link href="/contact?source=homepage" prefetch={false} className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--oc-blue)] hover:text-[var(--oc-navy)]">
              Need aircraft support?
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
