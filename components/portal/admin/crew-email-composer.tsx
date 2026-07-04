"use client";

import { useMemo, useState } from "react";
import { Mail, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import {
  mergeCrewEmailText,
  type CrewEmailTemplateKey,
  type CrewEmailVariables,
} from "@/lib/portal/crew-email-templates";
import type { CrewEmailTemplateOption } from "@/lib/portal/crew-email";

type MissionOption = {
  id: string;
  label: string;
  variables: Partial<CrewEmailVariables>;
};

const inputClassName = "deck-input";

export function CrewEmailComposer({
  crewId,
  crewName,
  crewEmail,
  templates,
  variables,
  missionOptions,
  backTo,
  action,
}: {
  crewId: string;
  crewName: string;
  crewEmail: string;
  templates: CrewEmailTemplateOption[];
  variables: CrewEmailVariables;
  missionOptions: MissionOption[];
  backTo: string;
  action: (formData: FormData) => void | Promise<void>;
}) {
  const [templateKey, setTemplateKey] = useState<CrewEmailTemplateKey>(templates[0]?.key ?? "general_crew_communication");
  const selectedTemplate = templates.find((template) => template.key === templateKey) ?? templates[0];
  const [subject, setSubject] = useState(selectedTemplate?.subject ?? "");
  const [body, setBody] = useState(selectedTemplate?.body ?? "");
  const [missionId, setMissionId] = useState("");
  const [requestedDocuments, setRequestedDocuments] = useState("");
  const [overrideRecipient, setOverrideRecipient] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState(crewEmail);

  const mergedVariables = useMemo(() => {
    const missionVariables = missionOptions.find((mission) => mission.id === missionId)?.variables ?? {};
    return {
      ...variables,
      ...missionVariables,
      requested_documents: requestedDocuments,
    };
  }, [missionId, missionOptions, requestedDocuments, variables]);

  const previewSubject = mergeCrewEmailText(subject, mergedVariables);
  const previewBody = mergeCrewEmailText(body, mergedVariables);

  function selectTemplate(nextKey: CrewEmailTemplateKey) {
    const nextTemplate = templates.find((template) => template.key === nextKey);
    setTemplateKey(nextKey);
    if (nextTemplate) {
      setSubject(nextTemplate.subject);
      setBody(nextTemplate.body);
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="gap-2 rounded-full">
          <Mail className="h-4 w-4" />
          Send Email
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] overflow-y-auto border-[var(--deck-line)] bg-white text-[var(--deck-text)] sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="deck-title text-2xl">Send Email</DialogTitle>
          <DialogDescription className="text-[var(--amg-text-muted)]">
            AMG Operations · {crewName}
          </DialogDescription>
        </DialogHeader>

        <form action={action} className="contents">
          <input type="hidden" name="crew_id" value={crewId} />
          <input type="hidden" name="back_to" value={backTo} />
          <input type="hidden" name="recipient_email" value={overrideRecipient ? recipientEmail : crewEmail} />
          <input type="hidden" name="template_key" value={templateKey} />
          <input type="hidden" name="mission_id" value={missionId} />
          <input type="hidden" name="requested_documents" value={requestedDocuments} />

          <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <div className="grid gap-4">
              <label className="grid gap-2">
                <span className="deck-eyebrow !text-[0.6rem] !text-[var(--deck-text-2)]">Recipient</span>
                <input value={crewEmail} disabled className={`${inputClassName} text-[var(--amg-text-secondary)]`} />
              </label>

              <label className="flex items-center gap-3 rounded-lg border border-[var(--deck-line-strong)] bg-white px-3 py-2.5 text-sm">
                <input
                  type="checkbox"
                  checked={overrideRecipient}
                  onChange={(event) => setOverrideRecipient(event.target.checked)}
                  className="h-4 w-4 accent-[var(--deck-gold)]"
                />
                <span>Override recipient</span>
              </label>

              {overrideRecipient ? (
                <label className="grid gap-2">
                  <span className="deck-eyebrow !text-[0.6rem] !text-[var(--deck-text-2)]">Override Email</span>
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(event) => setRecipientEmail(event.target.value)}
                    className={inputClassName}
                  />
                </label>
              ) : null}

              <label className="grid gap-2">
                <span className="deck-eyebrow !text-[0.6rem] !text-[var(--deck-text-2)]">Template</span>
                <select
                  value={templateKey}
                  onChange={(event) => selectTemplate(event.target.value as CrewEmailTemplateKey)}
                  className={inputClassName}
                >
                  {templates.map((template) => (
                    <option key={template.key} value={template.key}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2">
                <span className="deck-eyebrow !text-[0.6rem] !text-[var(--deck-text-2)]">Related Mission</span>
                <select value={missionId} onChange={(event) => setMissionId(event.target.value)} className={inputClassName}>
                  <option value="">None selected</option>
                  {missionOptions.map((mission) => (
                    <option key={mission.id} value={mission.id}>
                      {mission.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2">
                <span className="deck-eyebrow !text-[0.6rem] !text-[var(--deck-text-2)]">Requested Documents</span>
                <textarea
                  value={requestedDocuments}
                  onChange={(event) => setRequestedDocuments(event.target.value)}
                  className={`${inputClassName} min-h-20 py-2`}
                  placeholder="medical certificate, recurrent training record"
                />
              </label>
            </div>

            <div className="grid gap-4">
              <label className="grid gap-2">
                <span className="deck-eyebrow !text-[0.6rem] !text-[var(--deck-text-2)]">Subject</span>
                <input name="subject" value={subject} onChange={(event) => setSubject(event.target.value)} className={inputClassName} />
              </label>

              <label className="grid gap-2">
                <span className="deck-eyebrow !text-[0.6rem] !text-[var(--deck-text-2)]">Body</span>
                <textarea
                  name="body"
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  rows={13}
                  className={`${inputClassName} py-2 leading-6`}
                />
              </label>
            </div>
          </div>

          <section className="deck-inset p-4">
            <p className="deck-eyebrow">Preview</p>
            <p className="mt-3 text-sm font-semibold text-[var(--deck-text)]">{previewSubject}</p>
            <div className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[var(--amg-text-secondary)]">{previewBody}</div>
          </section>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" className="rounded-full">
                Cancel
              </Button>
            </DialogClose>
            <SubmitButton className="gap-2 rounded-full" pendingText="Sending...">
              <Send className="h-4 w-4" />
              Send
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
