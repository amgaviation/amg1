import { NextResponse } from "next/server";
import { SITE_URL } from "@/lib/email/config";
import { suppressEmail, verifyUnsubscribeToken } from "@/lib/portal/lead-suppression";
import { logServerError } from "@/lib/errors/user-facing-errors";

/**
 * RFC 8058 one-click unsubscribe.
 *
 * Outreach mail carries `List-Unsubscribe-Post: List-Unsubscribe=One-Click`,
 * which is a promise to Gmail and Outlook that a bare POST to the
 * List-Unsubscribe URL — no human, no confirmation page, no cookies — removes
 * the recipient. Without a handler that promise is broken silently: the native
 * Unsubscribe button appears to work, the address keeps receiving mail, and the
 * recipient's next move is the spam button, which costs the sending domain far
 * more than the unsubscribe would have.
 *
 * Deliberately unauthenticated: the token IS the authentication. It carries the
 * address and an HMAC over it, verified in constant time, so it cannot be
 * forged into unsubscribing someone else and needs no session or lookup.
 */

export const dynamic = "force-dynamic";

export async function POST(_request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  const email = verifyUnsubscribeToken(token);

  // A bad token is answered 400 and nothing is written. It is never treated as
  // "unsubscribe whoever this might be".
  if (!email) {
    return NextResponse.json({ ok: false, error: "Invalid unsubscribe token" }, { status: 400 });
  }

  try {
    await suppressEmail(email, "unsubscribed", "RFC 8058 one-click unsubscribe");
  } catch (error) {
    // Report the failure rather than a cheerful 200: a mailbox provider that
    // believes the unsubscribe succeeded will not retry, and the address would
    // keep receiving mail it has opted out of.
    const referenceId = logServerError("One-click unsubscribe failed", error, {
      route: "/api/unsubscribe/[token]",
    });
    return NextResponse.json({ ok: false, referenceId }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

/**
 * Some clients follow the List-Unsubscribe URL as an ordinary link. Send those
 * to the human confirmation page rather than showing them JSON — and do not
 * unsubscribe on GET, which link-prefetchers and scanners would trigger.
 */
export async function GET(_request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  return NextResponse.redirect(new URL(`/unsubscribe/${token}`, SITE_URL), 302);
}
