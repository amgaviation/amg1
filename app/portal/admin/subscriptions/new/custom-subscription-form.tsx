"use client";

import { useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { createCustomClientSubscription } from "@/app/portal/actions/subscriptions";
import { DeckSelect, TextAreaField, TextField, Field } from "@/components/portal/ui/fields";
import { ClientPickerField } from "@/components/portal/ui/combobox";
import { Button } from "@/components/ui/button";

/**
 * Fully custom subscription: name, amount, interval, optional trial and
 * end (date or cycle count). Terms are previewed — amount, cadence, first
 * charge date, end — before anything is sent to Stripe.
 */

const INTERVALS = [
  { value: "weekly", label: "Weekly", per: "week", addFirst: (d: Date) => d.setDate(d.getDate() + 7) },
  { value: "monthly", label: "Monthly", per: "month", addFirst: (d: Date) => d.setMonth(d.getMonth() + 1) },
  { value: "quarterly", label: "Quarterly", per: "quarter", addFirst: (d: Date) => d.setMonth(d.getMonth() + 3) },
  { value: "yearly", label: "Yearly", per: "year", addFirst: (d: Date) => d.setFullYear(d.getFullYear() + 1) },
];

function PreviewButton({ onPreview, disabled }: { onPreview: () => void; disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="button" disabled={pending || disabled} onClick={onPreview}>
      {pending ? "Creating…" : "Preview Terms & Create"}
    </Button>
  );
}

export function CustomSubscriptionForm({
  clients,
}: {
  clients: { id: string; company_name?: string | null; full_name?: string | null; email?: string | null }[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [interval, setInterval] = useState("monthly");
  const [trialDays, setTrialDays] = useState("");
  const [endMode, setEndMode] = useState("none");
  const [endDate, setEndDate] = useState("");
  const [cycles, setCycles] = useState("");
  const [clientId, setClientId] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);

  const preview = useMemo(() => {
    const cadence = INTERVALS.find((i) => i.value === interval) ?? INTERVALS[1];
    const amt = Number.parseFloat(amount || "0");
    const trial = Number.parseInt(trialDays || "0", 10) || 0;
    const firstCharge = new Date();
    if (trial > 0) firstCharge.setDate(firstCharge.getDate() + trial);
    const amountText = Number.isFinite(amt) && amt > 0
      ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amt)
      : "—";
    const endText =
      endMode === "date" && endDate
        ? `Ends on ${endDate}`
        : endMode === "cycles" && cycles
          ? `Ends after ${cycles} billing cycle${cycles === "1" ? "" : "s"}`
          : "Renews until canceled";
    return {
      amountText,
      per: cadence.per,
      trial,
      firstChargeText: firstCharge.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
      endText,
      valid: Number.isFinite(amt) && amt >= 0.5 && name.trim().length > 0 && clientId.length > 0,
    };
  }, [amount, interval, trialDays, endMode, endDate, cycles, name, clientId]);

  return (
    <form ref={formRef} action={createCustomClientSubscription} className="grid gap-4">
      <ClientPickerField clients={clients} required onValueChange={setClientId} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Subscription Name" name="custom_name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Dedicated Crew Retainer" />
        <TextField label="Amount (USD)" name="custom_amount" type="number" min="0.5" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} />
        <Field label="Billing Interval" required>
          <DeckSelect
            name="custom_interval"
            value={interval}
            onChange={(e) => setInterval(e.target.value)}
            options={INTERVALS.map((i) => ({ value: i.value, label: i.label }))}
          />
        </Field>
        <TextField label="Trial Days (optional)" name="trial_days" type="number" min="0" step="1" value={trialDays} onChange={(e) => setTrialDays(e.target.value)} />
        <Field label="Ends">
          <DeckSelect
            name="end_mode"
            value={endMode}
            onChange={(e) => setEndMode(e.target.value)}
            options={[
              { value: "none", label: "Renews until canceled" },
              { value: "date", label: "On a specific date" },
              { value: "cycles", label: "After a number of cycles" },
            ]}
          />
        </Field>
        {endMode === "date" ? (
          <TextField label="End Date" name="end_date" type="date" required value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        ) : endMode === "cycles" ? (
          <TextField label="Number of Cycles" name="cycles" type="number" min="1" step="1" required value={cycles} onChange={(e) => setCycles(e.target.value)} />
        ) : (
          <div />
        )}
      </div>
      <TextAreaField label="Description (shown to the client)" name="custom_description" placeholder="What this subscription covers…" />
      <TextAreaField label="Internal Notes" name="notes" />
      <div className="flex items-center gap-3">
        <PreviewButton onPreview={() => setPreviewOpen(true)} disabled={!preview.valid} />
        {!preview.valid ? (
          <span className="text-xs text-[var(--deck-text-3)]">Select a client, name the subscription, and enter an amount of at least $0.50.</span>
        ) : null}
      </div>

      {previewOpen ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[var(--deck-scrim)] p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="deck-card w-full max-w-md p-6">
            <p className="deck-eyebrow">Confirm Subscription Terms</p>
            <h2 className="deck-title mt-1.5 text-lg">{name.trim()}</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-4"><dt className="text-[var(--deck-text-3)]">Amount</dt><dd className="deck-num font-semibold">{preview.amountText} / {preview.per}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-[var(--deck-text-3)]">Trial</dt><dd>{preview.trial > 0 ? `${preview.trial} days` : "None"}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-[var(--deck-text-3)]">First charge</dt><dd>{preview.firstChargeText}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-[var(--deck-text-3)]">Term</dt><dd>{preview.endText}</dd></div>
            </dl>
            <p className="mt-4 text-xs text-[var(--deck-text-3)]">
              The client receives a secure Stripe Checkout link by email; billing starts when they complete setup.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setPreviewOpen(false)}>Back</Button>
              <Button
                type="button"
                onClick={() => {
                  setPreviewOpen(false);
                  formRef.current?.requestSubmit();
                }}
              >
                Create & Send Setup Link
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </form>
  );
}
