"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { saveNetworkApplicationStatus } from "@/app/portal/actions/network-applications";
import { SelectField, TextAreaField } from "@/components/portal/ui/fields";
import { Button } from "@/components/ui/button";
import {
  NETWORK_APPLICATION_STATUSES,
  NETWORK_DENIAL_REASONS,
  NETWORK_STATUS_LABELS,
  type NetworkApplicationStatus,
} from "@/lib/portal/network-application-constants";
import {
  buildNetworkDecisionEmailCopy,
  decisionReasonFor,
  mergeTemplateTokens,
  networkDecisionTemplateKey,
  renderDecisionEmailText,
  NETWORK_EMAIL_DISCLAIMER,
} from "@/lib/portal/network-application-email-copy";

function PreviewSubmitButton({ onPreview }: { onPreview: () => void }) {
  const { pending } = useFormStatus();
  return (
    <Button type="button" className="w-fit rounded-md" disabled={pending} onClick={onPreview}>
      {pending ? "Saving..." : "Review Email and Send"}
    </Button>
  );
}

export function StatusReviewForm({
  applicationId,
  applicantName,
  currentStatus,
  backTo,
  missingInformation,
  otherStatusReason,
  denialReason,
  templateOverrides,
}: {
  applicationId: string;
  applicantName: string;
  currentStatus: NetworkApplicationStatus;
  backTo: string;
  missingInformation?: string | null;
  otherStatusReason?: string | null;
  denialReason?: string | null;
  /** Globally customized decision templates (Settings → Email Templates), keyed by template key. */
  templateOverrides?: Record<string, { subject: string; body: string }>;
}) {
  const [status, setStatus] = useState<NetworkApplicationStatus>(currentStatus);
  const [denialChoice, setDenialChoice] = useState<string>(denialReason && !NETWORK_DENIAL_REASONS.includes(denialReason as (typeof NETWORK_DENIAL_REASONS)[number]) ? "custom" : denialReason ?? NETWORK_DENIAL_REASONS[0]);
  const [customDenial, setCustomDenial] = useState<string>(denialReason ?? "");
  const [otherReason, setOtherReason] = useState<string>(otherStatusReason ?? "");
  const [previewOpen, setPreviewOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const effectiveDenialReason = denialChoice === "custom" ? customDenial : denialChoice;
  const copy = buildNetworkDecisionEmailCopy({
    status,
    fullName: applicantName,
    denialReason: effectiveDenialReason,
    otherStatusReason: otherReason,
  });
  const overrideKey = networkDecisionTemplateKey(status);
  const override = overrideKey ? templateOverrides?.[overrideKey] : undefined;
  const overridePreview = override
    ? (() => {
        const variables = {
          first_name: applicantName.split(/\s+/)[0] || applicantName,
          full_name: applicantName,
          reason: decisionReasonFor({
            status,
            denialReason: effectiveDenialReason,
            otherStatusReason: otherReason,
          }),
        };
        const parts = [
          `Subject: ${mergeTemplateTokens(override.subject, variables)}`,
          mergeTemplateTokens(override.body, variables),
        ];
        if (copy?.cta) parts.push(`${copy.cta.label}: (secure setup link included in the email)`);
        parts.push(NETWORK_EMAIL_DISCLAIMER);
        return parts.join("\n\n");
      })()
    : null;
  const previewText =
    status === "additional_information_needed"
      ? `Subject: Additional Information Needed for AMG Crew Network Review\n\nHello ${applicantName.split(/\s+/)[0]}, AMG needs additional information before crew-network review can continue.\n\nInformation requested:\n${missingInformation ?? "(from the field above)"}\n\n${NETWORK_EMAIL_DISCLAIMER}`
      : overridePreview ?? (copy
        ? `Subject: ${copy.subject}\n\n${renderDecisionEmailText(copy)}`
        : "No email is sent for this status.");

  return (
    <form ref={formRef} action={saveNetworkApplicationStatus} className="grid gap-4">
      <input type="hidden" name="application_id" value={applicationId} />
      <input type="hidden" name="back_to" value={backTo} />
      <SelectField
        label="Status"
        name="status"
        value={status}
        onChange={(event) => setStatus(event.target.value as NetworkApplicationStatus)}
        options={NETWORK_APPLICATION_STATUSES.map((item) => ({ value: item, label: NETWORK_STATUS_LABELS[item] }))}
      />
      {status === "denied" ? (
        <>
          <SelectField
            label="Denial reason"
            name="denial_reason_choice"
            value={denialChoice}
            onChange={(event) => setDenialChoice(event.target.value)}
            options={[
              ...NETWORK_DENIAL_REASONS.map((reason) => ({ value: reason, label: reason })),
              { value: "custom", label: "Custom reason…" },
            ]}
          />
          {denialChoice === "custom" ? (
            <TextAreaField
              label="Custom denial reason"
              name="denial_reason_custom"
              required
              value={customDenial}
              onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => setCustomDenial(event.target.value)}
              placeholder="This is inserted into the denial email verbatim."
            />
          ) : null}
        </>
      ) : null}
      {status === "additional_information_needed" ? (
        <TextAreaField
          label="Information requested"
          name="missing_information"
          required
          defaultValue={missingInformation ?? ""}
        />
      ) : null}
      {status === "other" ? (
        <TextAreaField
          label="Other status reason"
          name="other_status_reason"
          required
          value={otherReason}
          onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => setOtherReason(event.target.value)}
        />
      ) : null}
      <TextAreaField label="Status note" name="note" placeholder="Optional internal event note" />
      <PreviewSubmitButton onPreview={() => setPreviewOpen(true)} />

      {previewOpen ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-[var(--deck-scrim)] p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="email-preview-title"
        >
          <div className="deck-card w-full max-w-xl p-6">
            <p className="deck-eyebrow">Email Preview</p>
            <h2 id="email-preview-title" className="deck-title mt-1.5 text-lg">
              This is the exact email {applicantName} will receive
            </h2>
            <pre className="mt-4 max-h-72 overflow-y-auto whitespace-pre-wrap rounded-md border border-[var(--deck-line)] bg-[var(--deck-panel-2)] p-4 font-sans text-sm leading-6 text-[var(--deck-text)]">
              {previewText}
            </pre>
            <p className="mt-3 text-xs text-[var(--deck-text-3)]">
              Sent from the branded AMG email layout. Saving the status also records it in the application history.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setPreviewOpen(false)}>
                Back
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setPreviewOpen(false);
                  formRef.current?.requestSubmit();
                }}
              >
                Save Status and Send Email
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </form>
  );
}
