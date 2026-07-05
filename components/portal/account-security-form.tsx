import { updatePortalEmail, updatePortalPassword } from "@/app/portal/actions/auth";
import { TextField } from "@/components/portal/ui/fields";
import { SectionCard } from "@/components/portal/ui/primitives";
import { SubmitButton } from "@/components/portal/ui/submit-button";

export function AccountSecurityForm({
  email,
  backTo,
}: {
  email: string;
  backTo: string;
}) {
  return (
    <SectionCard
      title="Login & Security"
      icon="shield"
      description="Update the email address tied to this portal account and set a new password."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <form action={updatePortalEmail} className="grid gap-4 rounded-lg border border-border bg-[var(--deck-panel-2)] p-4">
          <input type="hidden" name="back_to" value={backTo} />
          <TextField
            label="Portal Email"
            name="email"
            type="email"
            required
            defaultValue={email}
            hint="If secure email change is enabled, confirmation may be required."
          />
          <SubmitButton className="rounded-full" pendingText="Saving email...">
            Update Email
          </SubmitButton>
        </form>

        <form action={updatePortalPassword} className="grid gap-4 rounded-lg border border-border bg-[var(--deck-panel-2)] p-4">
          <input type="hidden" name="back_to" value={backTo} />
          <TextField
            label="New Password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            hint="Use at least 8 characters."
          />
          <TextField
            label="Confirm New Password"
            name="confirm_password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
          />
          <SubmitButton className="rounded-full" pendingText="Saving password...">
            Update Password
          </SubmitButton>
        </form>
      </div>
    </SectionCard>
  );
}
