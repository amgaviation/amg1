import Link from "next/link";
import { PortalSetupForm } from "./portal-setup-form";

export const metadata = {
  title: "AMG Portal Access Setup",
  description: "Set up access for your AMG client portal account.",
};

export default function PortalSetupPage() {
  return (
    <main className="flex min-h-screen items-center bg-background px-6 py-16">
      <section className="mx-auto w-full max-w-md rounded-xl border border-border bg-card p-6">
        <p className="eyebrow text-accent">AMG Portal</p>
        <h1 className="mt-4 font-display text-4xl font-extrabold uppercase tracking-wide text-foreground">
          Portal Access
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Use the secure setup link from your AMG email to finish portal access setup.
        </p>
        <PortalSetupForm />
        <Link href="/login" className="mt-6 inline-block text-sm text-accent hover:text-foreground">
          Back to login
        </Link>
      </section>
    </main>
  );
}
