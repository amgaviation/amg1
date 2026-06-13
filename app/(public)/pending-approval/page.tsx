import Link from "next/link";

export const metadata = {
  title: "AMG Portal Access Pending",
  description: "AMG portal access request pending approval.",
};

export default function PendingApprovalPage() {
  return (
    <main className="cinematic-band flex min-h-screen items-center bg-background px-6 py-16">
      <section className="glass-panel mx-auto max-w-xl rounded-lg p-8 text-center">
        <p className="eyebrow text-accent">Access Review</p>
        <h1 className="mt-4 font-display text-5xl font-extrabold uppercase tracking-wide text-foreground">
          Pending approval
        </h1>
        <p className="mt-5 leading-relaxed text-muted-foreground">
          AMG Operations reviews every portal account before activation. You will be notified when access is approved or if more information is required.
        </p>
        <Link href="/login" className="mt-8 inline-flex rounded-full bg-primary px-6 py-3 font-display text-xs font-semibold uppercase tracking-widest text-primary-foreground" data-cursor="ENTER">
          Return to login
        </Link>
      </section>
    </main>
  );
}
