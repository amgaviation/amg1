import { ArrowRight } from "lucide-react";
import { updatePassword } from "@/app/portal/actions/auth";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { PortalAccessShell } from "@/components/site/portal-access-shell";

export const metadata = {
  title: "Create New AMG Portal Password",
  description: "Create a new password for your AMG portal account.",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  return (
    <PortalAccessShell
      eyebrow="AMG Portal"
      title="New password"
      description="Create a new password after opening a valid reset link from your email."
      backHref="/forgot-password"
      backLabel="Request a new link"
    >
      {params.error ? (
        <div className="mt-5 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-red-200">
          {params.error === "mismatch"
            ? "Passwords do not match."
            : params.error === "weakpassword"
              ? "Password must be at least 8 characters."
              : "Your password could not be updated. Request a fresh reset link and try again."}
        </div>
      ) : null}
      <form action={updatePassword} className="mt-6 grid gap-4">
        <label className="grid gap-2 text-sm text-muted-foreground">
          New password
          <input name="password" type="password" required minLength={8} autoComplete="new-password" className="support-field h-12 px-4 text-base" data-cursor="TYPE" />
        </label>
        <label className="grid gap-2 text-sm text-muted-foreground">
          Confirm password
          <input name="confirm_password" type="password" required minLength={8} autoComplete="new-password" className="support-field h-12 px-4 text-base" data-cursor="TYPE" />
        </label>
        <SubmitButton pendingText="Updating..." className="h-12 rounded-full font-display text-xs font-semibold uppercase tracking-widest">
          Update password
          <ArrowRight className="h-4 w-4" />
        </SubmitButton>
      </form>
    </PortalAccessShell>
  );
}
