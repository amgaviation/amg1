import Link from "next/link";

export const metadata = {
  title: "AMG Portal Access Denied",
  description: "AMG portal access denied or unavailable.",
};

export default function AccessDeniedPage() {
  return (
    <main className="cinematic-band flex min-h-screen items-center bg-background px-6 py-16">
      <section className="glass-panel mx-auto max-w-xl rounded-lg p-8 text-center">
        <p className="eyebrow text-accent">Portal Security</p>
        <h1 className="mt-4 font-display text-5xl font-extrabold uppercase tracking-wide text-foreground">
          Access denied
        </h1>
        <p className="mt-5 leading-relaxed text-muted-foreground">
          Your account is not authorized for that portal area. AMG routes users by approved role and account status.
        </p>
        <Link href="/portal" className="mt-8 inline-flex rounded-full bg-primary px-6 py-3 font-display text-xs font-semibold uppercase tracking-widest text-primary-foreground" data-cursor="ENTER">
          Go to my portal
        </Link>
      </section>
    </main>
  );
}
