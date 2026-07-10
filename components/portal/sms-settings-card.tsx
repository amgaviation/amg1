import {
  confirmSmsVerificationCode,
  sendSmsVerificationCode,
  updateSmsNotificationPreference,
} from "@/app/portal/actions/phone-verification";
import { CheckboxField, TextField } from "@/components/portal/ui/fields";
import { Notice, SectionCard } from "@/components/portal/ui/primitives";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { phoneVerificationConfigured } from "@/lib/portal/phone-verification";
import { formatDateTime } from "@/lib/portal/format";

const SMS_SUCCESS_MESSAGES: Record<string, string> = {
  "code-sent": "Verification code sent. Enter it below to confirm your mobile number.",
  verified: "Mobile number verified. Urgent alerts can now reach you by text.",
  "preference-saved": "SMS notification preference saved.",
};

const SMS_ERROR_MESSAGES: Record<string, string> = {
  "invalid-phone": "Enter a valid mobile number, e.g. +1 555 123 4567.",
  "invalid-code": "That code is not valid. Check the text message and try again.",
  expired: "That code has expired. Request a new one.",
  "too-many-attempts": "Too many incorrect attempts. Request a new code.",
  cooldown: "A code was just sent. Wait a minute before requesting another.",
  "no-pending": "No verification is in progress. Request a new code first.",
  "not-configured": "Text messaging is not enabled for this portal environment yet.",
};

export function SmsSettingsNotices({ sms, smsError }: { sms?: string; smsError?: string }) {
  return (
    <>
      {sms && SMS_SUCCESS_MESSAGES[sms] ? (
        <Notice tone="success">{SMS_SUCCESS_MESSAGES[sms]}</Notice>
      ) : null}
      {smsError ? (
        <Notice tone="danger">
          {SMS_ERROR_MESSAGES[smsError] ?? "The SMS request could not be completed."}
        </Notice>
      ) : null}
    </>
  );
}

export function SmsSettingsCard({
  backTo,
  phone,
  phoneVerifiedAt,
  phoneVerificationSentAt,
  smsEnabled,
}: {
  backTo: string;
  phone: string | null;
  phoneVerifiedAt: string | null;
  phoneVerificationSentAt: string | null;
  smsEnabled: boolean;
}) {
  const configured = phoneVerificationConfigured();
  const verified = Boolean(phone && phoneVerifiedAt);
  const pendingCode = Boolean(phone && !verified && phoneVerificationSentAt);

  return (
    <SectionCard
      title="SMS Alerts"
      icon="phone"
      description="Verify a mobile number to receive urgent operational alerts — AOG, assignments, quotes, and invoices — by text message."
    >
      {!configured ? (
        <p className="text-sm text-muted-foreground">
          Text messaging is not enabled for this portal environment yet. Contact AMG
          Operations if you expected SMS alerts to be available.
        </p>
      ) : (
        <div className="grid gap-6">
          {verified ? (
            <Notice tone="success">
              {phone} verified on {formatDateTime(phoneVerifiedAt)}.
            </Notice>
          ) : pendingCode ? (
            <Notice tone="info">
              A verification code was sent to {phone}. Codes expire after 10 minutes.
            </Notice>
          ) : null}

          <div className="grid gap-6 lg:grid-cols-2">
            <form action={sendSmsVerificationCode} className="deck-inset grid gap-4 p-4">
              <input type="hidden" name="back_to" value={backTo} />
              <TextField
                label="Mobile Number"
                name="phone"
                type="tel"
                required
                defaultValue={phone ?? ""}
                placeholder="+1 555 123 4567"
                hint="US numbers may omit the +1. Changing the number requires re-verification."
              />
              <SubmitButton className="rounded-full" pendingText="Sending code...">
                {verified ? "Change Number" : "Send Verification Code"}
              </SubmitButton>
            </form>

            {pendingCode ? (
              <form action={confirmSmsVerificationCode} className="deck-inset grid gap-4 p-4">
                <input type="hidden" name="back_to" value={backTo} />
                <TextField
                  label="Verification Code"
                  name="code"
                  required
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="123456"
                  hint="Didn't get it? You can request a new code every 60 seconds."
                />
                <SubmitButton className="rounded-full" pendingText="Confirming...">
                  Confirm Code
                </SubmitButton>
              </form>
            ) : null}

            {verified ? (
              <form
                action={updateSmsNotificationPreference}
                className="deck-inset grid gap-4 p-4"
              >
                <input type="hidden" name="back_to" value={backTo} />
                <CheckboxField
                  label="Send urgent operational alerts to this number"
                  name="sms_notifications_enabled"
                  defaultChecked={smsEnabled}
                />
                <SubmitButton className="rounded-full" pendingText="Saving...">
                  Save SMS Preference
                </SubmitButton>
              </form>
            ) : null}
          </div>
        </div>
      )}
    </SectionCard>
  );
}
