import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { requestPasswordReset } from "@/app/portal/actions/auth";
import { SubmitButton } from "@/components/portal/ui/submit-button";

export const metadata = {
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
    <main className="cinematic-band flex min-h-screen items-center bg-background px-6 py-16">
      <section className="glass-panel mx-auto w-full max-w-md rounded-lg p-6">
        <p className="eyebrow text-accent">AMG Portal</p>
        <h1 className="mt-4 font-display text-4xl font-extrabold uppercase tracking-wide text-foreground">
          Reset password
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Enter the email tied to your approved portal account. If it exists, Supabase will send a secure reset link.
        </p>
        {params.success === "sent" ? (
          <div className="mt-5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            Reset link sent if the account is eligible.
          </div>
        ) : null}
        {params.error ? (
          <div className="mt-5 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-red-200">
            {params.error === "missing" ? "Enter your email address." : "The reset link could not be sent."}
          </div>
        ) : null}
        <form action={requestPasswordReset} className="mt-6 grid gap-4">
          <label className="grid gap-2 text-sm text-muted-foreground">
            Email
            <input name="email" type="email" required autoComplete="email" className="support-field h-12 px-4 text-base" data-cursor="TYPE" />
          </label>
          <SubmitButton pendingText="Sending..." className="h-12 rounded-full font-display text-xs font-semibold uppercase tracking-widest">
            Send reset link
            <ArrowRight className="h-4 w-4" />
          </SubmitButton>
        </form>
        <Link href="/login" className="mt-6 inline-block text-sm text-accent hover:text-foreground">
          Back to login
        </Link>
      </section>
    </main>
  );
}
