import type { Metadata } from "next";
import { confirmUnsubscribe } from "./actions";
import { verifyUnsubscribeToken } from "@/lib/portal/lead-suppression";

export const metadata: Metadata = {
  title: "Unsubscribe — AMG Aviation Group",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * One-click unsubscribe target for outreach email footers.
 *
 * No login, by design — the recipient is a stranger with no portal account, and
 * requiring one would make the opt-out non-functional, which is the thing
 * CAN-SPAM actually prohibits.
 *
 * The GET only reads. The suppression write happens on POST, because mail
 * clients and security scanners routinely prefetch links in email, and a
 * scanner should not be able to unsubscribe someone who never clicked. The
 * RFC 8058 List-Unsubscribe-Post header points at the POST route for the same
 * reason.
 */
export default async function UnsubscribePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ done?: string }>;
}) {
  const { token } = await params;
  const { done } = await searchParams;
  const email = verifyUnsubscribeToken(token);

  return (
    <main className="oc-shell flex min-h-[60vh] flex-col justify-center py-20">
      <div className="mx-auto w-full max-w-xl rounded-lg border border-[var(--oc-line)] p-8">
        {!email ? (
          <>
            <h1 className="text-2xl font-semibold">This link isn&rsquo;t valid</h1>
            <p className="mt-4 text-[var(--oc-aluminum)]">
              We couldn&rsquo;t read that unsubscribe link. It may have been truncated by your
              email client. Email{" "}
              <a className="underline" href="mailto:information@amgaviationgroup.com">
                information@amgaviationgroup.com
              </a>{" "}
              and we&rsquo;ll remove you right away.
            </p>
          </>
        ) : done === "1" ? (
          <>
            <h1 className="text-2xl font-semibold">You&rsquo;re unsubscribed</h1>
            <p className="mt-4 text-[var(--oc-aluminum)]">
              We&rsquo;ve removed <strong>{email}</strong> from AMG outreach. You won&rsquo;t
              receive further messages from us.
            </p>
            <p className="mt-4 text-sm text-[var(--oc-aluminum-2)]">
              This doesn&rsquo;t affect service messages about work already underway.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-semibold">Unsubscribe from AMG outreach</h1>
            <p className="mt-4 text-[var(--oc-aluminum)]">
              Confirm and we&rsquo;ll stop contacting <strong>{email}</strong>.
            </p>
            <form action={confirmUnsubscribe} className="mt-6">
              <input type="hidden" name="token" value={token} />
              <button
                type="submit"
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--instrument)] px-6 py-3 font-mono text-sm uppercase [letter-spacing:0.14em] text-white transition hover:bg-[var(--instrument)]/85"
              >
                Unsubscribe me
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
