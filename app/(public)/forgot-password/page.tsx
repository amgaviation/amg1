import { ArrowRight } from "lucide-react";
import { requestPasswordReset } from "@/app/portal/actions/auth";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { PortalAccessShell } from "@/components/site/portal-access-shell";
import { getUserFacingErrorMessage } from "@/lib/errors/user-facing-errors";

export const metadata = {
  robots: { index: false, follow: true },
  title: "Reset AMG Portal Password",
  description: "Request a secure AMG portal password reset link.",
};

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const params = await searchParams;
  return (
    <PortalAccessShell
      eyebrow="AMG Portal"
      title="Reset password"
      description="Enter the email tied to your approved portal account. If it exists and is eligible, AMG will send a secure reset link."
    >
      {params.success === "sent" ? (
        <div className="mt-5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          Reset link sent if the account is eligible.
        </div>
      ) : null}
      {params.error ? (
        <div className="mt-5 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-red-200">
          {params.error === "missing"
            ? "Enter your email address."
            : getUserFacingErrorMessage({ audience: "public", area: "auth", action: "update" })}
        </div>
      ) : null}
      <form action={requestPasswordReset} className="mt-6 grid gap-4">
        <label className="grid gap-2 text-sm text-muted-foreground">
          Email
          <input name="email" type="email" required autoComplete="email" className="support-field h-12 px-4 text-base" />
        </label>
        <SubmitButton pendingText="Sending..." className="h-12 rounded-full font-display text-xs font-semibold uppercase tracking-widest">
          Send reset link
          <ArrowRight className="h-4 w-4" />
        </SubmitButton>
      </form>
    </PortalAccessShell>
  );
}
