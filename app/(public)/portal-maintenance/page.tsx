import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Portal Temporarily Unavailable — AMG Aviation Group",
  description: "AMG's external portal is temporarily unavailable while support requests are handled directly by the Operations team.",
  robots: { index: false },
};

export default function PortalMaintenancePage() {
  return (
    <main className="pub-hero oc-shell flex min-h-screen items-center py-20">
      <section className="max-w-2xl">
        <p className="oc-eyebrow">AMG Connect</p>
        <h1 className="oc-display mt-4 text-5xl text-[var(--oc-paper)] sm:text-6xl">External portal access is temporarily unavailable.</h1>
        <p className="mt-6 text-lg leading-relaxed text-[var(--oc-aluminum)]">AMG is handling support requests directly while the external portal is under maintenance. Submit a request and the Operations team will review it manually.</p>
        <Link href="/request" className="oc-btn oc-btn-light mt-8">Request Support</Link>
      </section>
    </main>
  );
}
