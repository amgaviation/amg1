import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, MailCheck, ShieldCheck } from "lucide-react";

import { resendPortalVerificationCode, verifyPortalEmail } from "@/app/portal/actions/auth";

export const metadata: Metadata = {
  title: "Verify AMG Connect Email",
  description: "Verify your AMG Connect portal access request with the code from your email.",
};

const ERROR_MESSAGES: Record<string, string> = {
  missing: "Enter your email address and the verification code from your AMG email.",
  invalid: "That verification code is invalid. Check the email from AMG and try again.",
  expired: "That verification code has expired. Submit a new access request or contact AMG Operations.",
  failed: "We could not verify that code. Please try again or contact AMG Operations.",
};

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; error?: string; success?: string }>;
}) {
  const params = await searchParams;
  const email = typeof params.email === "string" ? params.email : "";
  const errorMessage = params.error ? ERROR_MESSAGES[params.error] : null;

  return (
    <main className="min-h-svh bg-[#050B14] text-white">
      <section className="relative isolate grid min-h-svh overflow-hidden px-6 py-16 md:px-10 lg:grid-cols-[minmax(0,1fr)_32rem] lg:py-20">
        <div className="absolute inset-0 -z-10" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/site/map-operations.jpg"
            alt=""
            className="h-full w-full scale-105 object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#050B14] via-[#07111F]/90 to-[#07111F]/55" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050B14] via-[#050B14]/70 to-[#050B14]/40" />
        </div>

        <div className="hidden max-w-3xl self-center lg:block">
          <div className="inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-[#3B82F6]">
            <span className="h-px w-12 bg-[#3B82F6]/70" />
            AMG Connect
          </div>
          <h1 className="mt-6 font-display text-6xl font-semibold uppercase tracking-tight text-white xl:text-7xl">
            Verify portal access
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-[#C0C7D1]">
            Use the verification code from your AMG Connect email. The email button
            only opens this page; verification happens after you submit the code.
          </p>
        </div>

        <section className="mx-auto flex w-full max-w-lg items-center">
          <div className="w-full rounded-2xl border border-white/[0.12] bg-white/[0.07] p-6 shadow-2xl shadow-black/35 backdrop-blur-xl sm:p-8">
            <div className="mb-7 flex items-start justify-between gap-5">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/[0.10] bg-[#07111F]/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#9CA3AF]">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#3B82F6]" />
                  Email Check
                </div>
                <h2 className="font-display text-4xl font-semibold uppercase tracking-tight text-white sm:text-5xl">
                  Verify Email
                </h2>
                <p className="mt-4 text-sm leading-6 text-[#C0C7D1]">
                  Use the verification code below to verify your AMG Connect
                  account. AMG Operations still reviews every account before
                  portal activation.
                </p>
              </div>
              <MailCheck className="mt-2 hidden h-7 w-7 shrink-0 text-[#3B82F6] sm:block" />
            </div>

            {params.success === "requested" ? (
              <div className="mb-4 rounded-xl border border-[#3B82F6]/30 bg-[#3B82F6]/10 px-4 py-3 text-sm leading-6 text-white">
                Access request submitted. Check your email for the AMG Connect
                verification code.
              </div>
            ) : null}

            {params.success === "resent" ? (
              <div className="mb-4 rounded-xl border border-[#3B82F6]/30 bg-[#3B82F6]/10 px-4 py-3 text-sm leading-6 text-white">
                If a pending AMG Connect verification exists for that email, a
                new code has been sent.
              </div>
            ) : null}

            {errorMessage ? (
              <div className="mb-4 rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-100">
                {errorMessage}
              </div>
            ) : null}

            <form action={verifyPortalEmail} className="grid gap-5">
              <label className="grid gap-2 text-sm font-medium text-white/80">
                Email Address
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  defaultValue={email}
                  placeholder="name@company.com"
                  className="h-12 rounded-lg border border-white/[0.10] bg-[#07111F]/75 px-4 text-base text-white outline-none transition placeholder:text-[#9CA3AF] focus:border-[#3B82F6]"
                />
              </label>

              <label className="grid gap-2 text-sm font-medium text-white/80">
                Verification Code
                <input
                  name="token"
                  inputMode="text"
                  pattern="[A-Za-z0-9_\\- ]{6,160}"
                  required
                  autoComplete="one-time-code"
                  placeholder="Paste code from email"
                  className="h-12 rounded-lg border border-white/[0.10] bg-[#07111F]/75 px-4 text-center font-mono text-base tracking-[0.08em] text-white outline-none transition placeholder:font-sans placeholder:tracking-normal placeholder:text-[#9CA3AF] focus:border-[#3B82F6]"
                />
              </label>

              <button className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#3B82F6] px-6 py-4 font-display text-sm font-semibold uppercase tracking-widest text-white transition hover:bg-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2 focus:ring-offset-[#050B14]">
                Verify Email
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                formAction={resendPortalVerificationCode}
                formNoValidate
                className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-white/[0.14] px-6 py-4 font-display text-sm font-semibold uppercase tracking-widest text-white/85 transition hover:border-[#3B82F6] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2 focus:ring-offset-[#050B14]"
              >
                Resend Verification Code
              </button>
            </form>

            <Link
              href="/login"
              className="mt-6 inline-flex text-sm font-medium text-[#3B82F6] underline-offset-4 hover:text-white hover:underline"
            >
              Back to login
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}
