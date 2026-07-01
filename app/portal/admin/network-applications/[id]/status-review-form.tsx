"use client";

import { useState } from "react";
import { saveNetworkApplicationStatus } from "@/app/portal/actions/network-applications";
import { SelectField, TextAreaField } from "@/components/portal/ui/fields";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import {
  NETWORK_APPLICATION_STATUSES,
  NETWORK_STATUS_LABELS,
  type NetworkApplicationStatus,
} from "@/lib/portal/network-application-constants";

export function StatusReviewForm({
  applicationId,
  currentStatus,
  backTo,
  missingInformation,
  otherStatusReason,
}: {
  applicationId: string;
  currentStatus: NetworkApplicationStatus;
  backTo: string;
  missingInformation?: string | null;
  otherStatusReason?: string | null;
}) {
  const [status, setStatus] = useState<NetworkApplicationStatus>(currentStatus);

  return (
    <form action={saveNetworkApplicationStatus} className="grid gap-4">
      <input type="hidden" name="application_id" value={applicationId} />
      <input type="hidden" name="back_to" value={backTo} />
      <SelectField
        label="Status"
        name="status"
        value={status}
        onChange={(event) => setStatus(event.target.value as NetworkApplicationStatus)}
        options={NETWORK_APPLICATION_STATUSES.map((item) => ({ value: item, label: NETWORK_STATUS_LABELS[item] }))}
      />
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
          defaultValue={otherStatusReason ?? ""}
        />
      ) : null}
      <TextAreaField label="Status note" name="note" placeholder="Optional internal event note" />
      <SubmitButton className="w-fit rounded-full" pendingText="Saving..." confirm="Save this status and send the matching AMG status email?">
        Save and Send Email
      </SubmitButton>
    </form>
  );
}
