import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { updatePassword } from "@/app/portal/actions/auth";
import { SubmitButton } from "@/components/portal/ui/submit-button";

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
    <main className="flex min-h-screen items-center bg-background px-6 py-16">
      <section className="mx-auto w-full max-w-md rounded-xl border border-border bg-card p-6">
        <p className="eyebrow text-accent">AMG Portal</p>
        <h1 className="mt-4 font-display text-4xl font-extrabold uppercase tracking-wide text-foreground">
          New password
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Create a new password after opening a valid reset link from your email.
        </p>
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
            <input name="password" type="password" required minLength={8} autoComplete="new-password" className="h-12 rounded-lg border border-input bg-background px-4 text-base text-foreground outline-none focus:border-accent" />
          </label>
          <label className="grid gap-2 text-sm text-muted-foreground">
            Confirm password
            <input name="confirm_password" type="password" required minLength={8} autoComplete="new-password" className="h-12 rounded-lg border border-input bg-background px-4 text-base text-foreground outline-none focus:border-accent" />
          </label>
          <SubmitButton pendingText="Updating..." className="h-12 rounded-full font-display text-xs font-semibold uppercase tracking-widest">
            Update password
            <ArrowRight className="h-4 w-4" />
          </SubmitButton>
        </form>
        <Link href="/forgot-password" className="mt-6 inline-block text-sm text-accent hover:text-foreground">
          Request a new link
        </Link>
      </section>
    </main>
  );
}
