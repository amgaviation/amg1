"use client";

import { useState } from "react";
import { scheduleLeadEmailAction, sendLeadEmailAction } from "@/app/portal/actions/crm";
import { DeckSelect, TextAreaField, TextField } from "@/components/portal/ui/fields";
import { Notice, SectionCard } from "@/components/portal/ui/primitives";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import {
  LEAD_BUSINESS_TYPES,
  LEAD_EMAIL_STAGES,
  type LeadBusinessType,
  type LeadEmailStage,
  type TemplateCopy,
} from "@/lib/portal/lead-email-templates";

const STAGE_OPTIONS = LEAD_EMAIL_STAGES.map((stage) => ({ value: stage.value, label: stage.label }));
const TYPE_OPTIONS = LEAD_BUSINESS_TYPES.map((type) => ({ value: type.value, label: type.label }));

function isStage(value: string): value is LeadEmailStage {
  return LEAD_EMAIL_STAGES.some((stage) => stage.value === value);
}

export function LeadEmailComposer({
  leadId,
  recipientEmail,
  leadStage,
  defaultBusinessType,
  templates,
  providerConfigured,
  backTo,
}: {
  leadId: string;
  recipientEmail: string | null;
  leadStage: string;
  defaultBusinessType: LeadBusinessType;
  /** Stage × business-type template copy, overrides applied and variables merged server-side. */
  templates: Record<LeadEmailStage, Record<LeadBusinessType, TemplateCopy>>;
  providerConfigured: boolean;
  backTo: string;
}) {
  const initialStage: LeadEmailStage = isStage(leadStage) ? leadStage : "new";
  const [businessType, setBusinessType] = useState<LeadBusinessType>(defaultBusinessType);
  const [templateStage, setTemplateStage] = useState<LeadEmailStage>(initialStage);
  const initial = templates[initialStage][defaultBusinessType];
  const [subject, setSubject] = useState(initial.subject);
  const [body, setBody] = useState(initial.body);

  function applyTemplate(stage: LeadEmailStage, type: LeadBusinessType) {
    const next = templates[stage][type];
    setSubject(next.subject);
    setBody(next.body);
  }

  return (
    <SectionCard
      title="Email Lead"
      icon="mail"
      description="Pre-written outreach for every pipeline stage, adapted to the kind of business this lead is. Edit freely before sending — sent emails are logged to the activity history."
    >
      {!recipientEmail ? (
        <Notice tone="info">Add an email address to this lead to send outreach.</Notice>
      ) : (
        <form action={sendLeadEmailAction} className="grid gap-4">
          <input type="hidden" name="lead_id" value={leadId} />
          <input type="hidden" name="back_to" value={backTo} />
          <input type="hidden" name="recipient_email" value={recipientEmail} />

          {!providerConfigured ? (
            <Notice tone="warn">
              The email provider is not configured for this environment — sending will fail until it is.
            </Notice>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1.5">
              <span className="deck-eyebrow !text-[0.6rem] !text-[var(--deck-text-2)]">Template</span>
              <DeckSelect
                aria-label="Email template"
                options={STAGE_OPTIONS}
                value={templateStage}
                onChange={(event) => {
                  const stage = event.target.value;
                  if (!isStage(stage)) return;
                  setTemplateStage(stage);
                  applyTemplate(stage, businessType);
                }}
              />
            </label>
            <label className="grid gap-1.5">
              <span className="deck-eyebrow !text-[0.6rem] !text-[var(--deck-text-2)]">Business Type</span>
              <DeckSelect
                aria-label="Lead business type"
                options={TYPE_OPTIONS}
                value={businessType}
                onChange={(event) => {
                  const type = event.target.value as LeadBusinessType;
                  setBusinessType(type);
                  applyTemplate(templateStage, type);
                }}
              />
            </label>
          </div>

          <TextField
            label={`To: ${recipientEmail}`}
            name="subject"
            required
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            placeholder="Subject"
          />
          <TextAreaField
            label="Message"
            name="body"
            required
            rows={14}
            value={body}
            onChange={(event) => setBody(event.target.value)}
          />

          <div className="flex flex-wrap items-end justify-between gap-3">
            <p className="text-[0.7rem] text-[var(--deck-text-3)]">
              Switching template or business type replaces the draft.
            </p>
            <div className="flex flex-wrap items-end gap-2">
              <label className="grid gap-1.5">
                <span className="deck-eyebrow !text-[0.6rem] !text-[var(--deck-text-2)]">
                  Send later
                </span>
                <input
                  type="datetime-local"
                  name="send_at"
                  className="deck-input w-auto"
                  aria-label="Schedule send time"
                />
              </label>
              <SubmitButton
                formAction={scheduleLeadEmailAction}
                variant="outline"
                pendingText="Scheduling…"
              >
                Schedule
              </SubmitButton>
              <SubmitButton pendingText="Sending…" confirm={`Send this email to ${recipientEmail}?`}>
                Send Now
              </SubmitButton>
            </div>
          </div>
        </form>
      )}
    </SectionCard>
  );
}
