"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  FileText,
  LockKeyhole,
  LogIn,
  Plane,
  RadioTower,
  ShieldCheck,
  UserPlus,
} from "lucide-react";

import { signIn, signUp } from "@/app/portal/actions/auth";
import { IMG } from "@/lib/site-media";
import { cn } from "@/lib/utils";

const ERROR_MESSAGES: Record<string, string> = {
  missing: "Enter your email and password.",
  invalid: "Email or password is incorrect.",
  pending: "Your access request is awaiting AMG approval.",
  suspended: "This account has been suspended. Contact AMG Operations.",
  signup: "We could not create that account. The email may already be in use.",
  weakpassword: "Password must be at least 8 characters.",
  "missing-supabase-env":
    "Portal authentication is not configured in this environment. Add the Supabase URL and anon key to enable portal access.",
  account_exists:
    "An AMG portal account already exists for that email. Sign in, use Forgot Password, or contact AMG if you used the wrong email.",
};

const accessPanels = [
  {
    title: "Client",
    body: "Support requests, aircraft profiles, quotes, documents, billing, and AMG messages.",
    icon: FileText,
  },
  {
    title: "Crew",
    body: "Assignment review, credentials, support context, expenses, and AMG communication.",
    icon: BadgeCheck,
  },
  {
    title: "Operations",
    body: "AMG administration, access review, records, partner coordination, and support workflow oversight.",
    icon: ShieldCheck,
  },
];

const accessStats = [
  { label: "Role-based visibility", value: "Client / Crew / Ops" },
  { label: "Support records", value: "Requests, docs, billing" },
  { label: "Access posture", value: "Reviewed by AMG" },
] as const;

const secureInputClass =
  "min-h-12 rounded-xl border border-white/[0.13] bg-[#07111F]/82 px-4 text-base text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] outline-none transition placeholder:text-[var(--oc-aluminum-2)] focus:border-[var(--oc-blue)] focus-visible:ring-2 focus-visible:ring-[var(--oc-blue)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050B14]";

const secureLabelClass = "grid gap-2 text-sm font-semibold text-white/84";

function StatusMessage({ tone, children }: { tone: "error" | "success"; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "mb-4 rounded-2xl border px-4 py-3 text-sm leading-6",
        tone === "error"
          ? "border-red-400/25 bg-red-500/10 text-red-100"
          : "border-emerald-300/25 bg-emerald-500/10 text-emerald-100",
      )}
      role={tone === "error" ? "alert" : "status"}
    >
      {children}
    </div>
  );
}

export function PortalLogin({
  mode: initialMode = "signin",
  error,
  success,
}: {
  mode?: "signin" | "request";
  error?: string;
  success?: string;
}) {
  const [mode, setMode] = useState<"signin" | "request">(initialMode);

  const isSignIn = mode === "signin";

  return (
    <main className="relative isolate min-h-svh overflow-hidden bg-[#050B14] text-white">
      <Image
        src={IMG.generatedConnectDashboard}
        alt=""
        fill
        priority
        sizes="100vw"
        className="absolute inset-0 -z-30 object-cover opacity-42"
      />
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_78%_16%,rgba(59,130,246,0.24),transparent_30rem),linear-gradient(120deg,#050B14_0%,rgba(5,11,20,0.96)_42%,rgba(7,17,31,0.72)_100%)]" />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(192,199,209,0.055)_1px,transparent_1px),linear-gradient(180deg,rgba(192,199,209,0.04)_1px,transparent_1px)] bg-[size:88px_88px] opacity-45 [mask-image:linear-gradient(180deg,black,transparent_86%)]"
      />

      <section className="mx-auto grid min-h-svh w-full max-w-7xl gap-8 px-5 pb-10 pt-[calc(var(--public-header-height)+2rem)] sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:px-10 lg:pb-14 lg:pt-[calc(var(--public-header-height)+3rem)]">
        <div className="flex flex-col justify-between gap-10 rounded-2xl border border-white/[0.10] bg-white/[0.045] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.34)] backdrop-blur-xl sm:p-7 lg:min-h-[calc(100svh-var(--public-header-height)-7rem)]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.07] px-3 py-1.5 text-xs font-semibold uppercase text-[var(--oc-aluminum)]">
              <LockKeyhole className="h-3.5 w-3.5 text-[var(--oc-blue)]" aria-hidden="true" />
              Secure member access
            </div>

            <h1 className="mt-7 max-w-2xl text-5xl font-semibold leading-none text-white sm:text-6xl lg:text-7xl">
              AMG Connect
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-[var(--oc-aluminum)] sm:text-lg">
              Role-based portal access for approved aircraft owners, crew members, partners, and AMG operations teams.
            </p>

            <div className="mt-8 grid gap-3">
              {accessStats.map((stat) => (
                <div
                  key={stat.label}
                  className="grid gap-1 rounded-2xl border border-white/[0.10] bg-[#050B14]/58 p-4 sm:grid-cols-[0.75fr_1fr] sm:items-center"
                >
                  <p className="text-xs font-semibold uppercase text-[var(--oc-aluminum-2)]">{stat.label}</p>
                  <p className="text-sm font-semibold text-white">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="grid gap-3 sm:grid-cols-3">
              {accessPanels.map((panel) => {
                const Icon = panel.icon;

                return (
                  <article key={panel.title} className="rounded-2xl border border-white/[0.10] bg-white/[0.06] p-4">
                    <Icon className="h-5 w-5 text-[var(--oc-blue)]" aria-hidden="true" />
                    <h2 className="mt-4 text-base font-semibold text-white">{panel.title}</h2>
                    <p className="mt-2 text-xs leading-5 text-[var(--oc-aluminum)]">{panel.body}</p>
                  </article>
                );
              })}
            </div>

            <p className="mt-6 rounded-2xl border border-white/[0.10] bg-[#050B14]/62 p-4 text-xs leading-relaxed text-[var(--oc-aluminum-2)]">
              Portal visibility does not replace operational approval, crew confirmation, aircraft status review, or final support acceptance.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <div className="w-full max-w-[34rem]">
            <div className="rounded-3xl border border-white/[0.13] bg-[#07111F]/86 p-5 shadow-[0_32px_100px_rgba(0,0,0,0.38)] backdrop-blur-2xl sm:p-7">
              <div className="mb-6 flex items-start justify-between gap-5">
                <div>
                  <p className="text-xs font-semibold uppercase text-[var(--oc-blue)]">Approved Access</p>
                  <h2 className="mt-3 text-3xl font-semibold leading-tight text-white sm:text-4xl">
                    {isSignIn ? "Sign in to AMG Connect." : "Request portal access."}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-[var(--oc-aluminum)]">
                    {isSignIn
                      ? "Continue to the portal environment assigned to your approved role."
                      : "Submit your access details for AMG Operations review and approval."}
                  </p>
                </div>
                <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/[0.12] bg-white/[0.07] text-[var(--oc-blue)] sm:flex">
                  {isSignIn ? <LogIn className="h-5 w-5" aria-hidden="true" /> : <UserPlus className="h-5 w-5" aria-hidden="true" />}
                </span>
              </div>

              <div className="portal-login-mode-switch mb-5 grid grid-cols-2 gap-1 rounded-2xl border border-white/[0.11] bg-[#050B14]/74 p-1">
                <button
                  type="button"
                  onClick={() => setMode("signin")}
                  aria-pressed={isSignIn}
                  className={cn(
                    "inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--oc-blue)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050B14]",
                    isSignIn ? "bg-white text-[#07111f]" : "text-[var(--oc-aluminum)] hover:bg-white/[0.07] hover:text-white",
                  )}
                >
                  <LogIn className="h-4 w-4" aria-hidden="true" />
                  Sign in
                </button>

                <button
                  type="button"
                  onClick={() => setMode("request")}
                  aria-pressed={!isSignIn}
                  className={cn(
                    "inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--oc-blue)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050B14]",
                    !isSignIn ? "bg-white text-[#07111f]" : "text-[var(--oc-aluminum)] hover:bg-white/[0.07] hover:text-white",
                  )}
                >
                  <UserPlus className="h-4 w-4" aria-hidden="true" />
                  Request
                </button>
              </div>

              {error ? (
                <StatusMessage tone="error">{ERROR_MESSAGES[error] ?? "Something went wrong. Please try again."}</StatusMessage>
              ) : null}

              {success === "requested" ? (
                <StatusMessage tone="success">
                  Access request submitted. AMG Operations will review and approve your account.
                </StatusMessage>
              ) : null}

              {success === "password-reset" ? (
                <StatusMessage tone="success">
                  Password created. Sign in with your AMG portal email and new login key.
                </StatusMessage>
              ) : null}

              {error === "account_exists" ? (
                <div className="mb-4 grid gap-3 rounded-2xl border border-white/[0.10] bg-white/[0.06] px-4 py-4">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <button
                      type="button"
                      onClick={() => setMode("signin")}
                      className="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-full bg-white px-4 text-xs font-semibold uppercase text-[#07111f]"
                    >
                      Sign in
                    </button>

                    <Link
                      href="/forgot-password"
                      className="inline-flex min-h-10 items-center justify-center rounded-full border border-white/15 px-4 text-xs font-semibold uppercase text-white/75 transition hover:border-[var(--oc-blue)] hover:text-white"
                    >
                      Forgot password
                    </Link>

                    <Link
                      href="/contact"
                      className="inline-flex min-h-10 items-center justify-center rounded-full border border-white/15 px-4 text-xs font-semibold uppercase text-white/75 transition hover:border-[var(--oc-blue)] hover:text-white"
                    >
                      Wrong email
                    </Link>
                  </div>
                </div>
              ) : null}

              {isSignIn ? (
                <form action={signIn} className="grid gap-5">
                  <label htmlFor="email" className={secureLabelClass}>
                    Email
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="name@company.com"
                      className={secureInputClass}
                    />
                  </label>

                  <label htmlFor="password" className={secureLabelClass}>
                    <span className="flex items-center justify-between gap-4">
                      Password
                      <Link href="/forgot-password" className="text-sm font-medium text-[var(--oc-blue)] underline-offset-4 hover:underline">
                        Forgot password?
                      </Link>
                    </span>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      autoComplete="current-password"
                      placeholder="Password"
                      className={secureInputClass}
                    />
                  </label>

                  <button className="inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-white px-6 py-4 text-sm font-semibold uppercase text-[#07111f] transition hover:bg-white/90 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--oc-blue)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050B14]">
                    Sign in
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </button>

                  <p className="text-center text-xs leading-relaxed text-[var(--oc-aluminum-2)]">
                    Portal access is limited to approved users. Unauthorized access is denied.
                  </p>
                </form>
              ) : (
                <form action={signUp} className="grid gap-4">
                  <label className={secureLabelClass}>
                    Full name
                    <input name="full_name" required autoComplete="name" className={secureInputClass} />
                  </label>

                  <label className={secureLabelClass}>
                    Email
                    <input name="email" type="email" required autoComplete="email" className={secureInputClass} />
                  </label>

                  <label className={secureLabelClass}>
                    Create password
                    <input name="password" type="password" required minLength={8} autoComplete="new-password" className={secureInputClass} />
                  </label>

                  <input type="hidden" name="role" value="client" />

                  <label className={secureLabelClass}>
                    Organization
                    <input name="company_name" autoComplete="organization" className={secureInputClass} />
                  </label>

                  <label className={secureLabelClass}>
                    Phone
                    <input name="phone" type="tel" autoComplete="tel" className={secureInputClass} />
                  </label>

                  <button className="inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-white px-6 py-4 text-sm font-semibold uppercase text-[#07111f] transition hover:bg-white/90 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--oc-blue)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050B14]">
                    Submit access request
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </button>

                  <p className="text-center text-xs leading-relaxed text-[var(--oc-aluminum-2)]">
                    AMG Operations reviews and approves every account before activation.
                  </p>
                </form>
              )}
            </div>

            <div className="mt-4 grid gap-3 rounded-2xl border border-white/[0.10] bg-[#050B14]/72 p-4 text-xs leading-relaxed text-[var(--oc-aluminum-2)] backdrop-blur-xl sm:grid-cols-[auto_1fr]">
              <RadioTower className="mt-0.5 h-4 w-4 text-[var(--oc-blue)]" aria-hidden="true" />
              <p>
                AMG Connect centralizes access to portal workflows; it does not create mission acceptance, crew
                confirmation, or aircraft movement authorization.
              </p>
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute bottom-6 left-1/2 hidden -translate-x-1/2 items-center gap-3 rounded-full border border-white/[0.10] bg-[#050B14]/72 px-4 py-2 text-xs text-[var(--oc-aluminum-2)] backdrop-blur-xl xl:flex">
          <Plane className="h-3.5 w-3.5 text-[var(--oc-blue)]" aria-hidden="true" />
          Secure aviation support portal
        </div>
      </section>
    </main>
  );
}
