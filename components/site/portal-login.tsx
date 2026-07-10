"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  FileText,
  LogIn,
  ShieldCheck,
  UserPlus,
} from "lucide-react";

import { signIn, signUp } from "@/app/portal/actions/auth";
import { cn } from "@/lib/utils";

const ERROR_MESSAGES: Record<string, string> = {
  missing: "Enter your email and password.",
  invalid: "Email or password is incorrect.",
  pending: "Your access request is awaiting AMG approval.",
  suspended: "Portal access for this email is currently suspended. Please contact AMG Operations for more information.",
  signup: "We could not create that account. The email may already be in use.",
  weakpassword: "Password must be at least 8 characters.",
  "missing-supabase-env":
    "Portal authentication is not configured in this environment. Add the required authentication settings to enable portal access.",
  account_exists:
    "An AMG portal account already exists for this email. Please sign in or contact AMG Operations.",
  pending_request: "AMG already has a pending portal access request for this email.",
  waitlisted: "This portal access request is currently under AMG review. Please contact AMG Operations for more information.",
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

export function PortalLogin({
  mode: initialMode = "signin",
  error,
  success,
  publicSignupEnabled,
}: {
  mode?: "signin" | "request";
  error?: string;
  success?: string;
  publicSignupEnabled: boolean;
}) {
  const [mode, setMode] = useState<"signin" | "request">(
    publicSignupEnabled ? initialMode : "signin",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const isSignIn = mode === "signin";

  return (
    <div className="relative min-h-svh bg-[#07111f] text-white">
      {/* Full-bleed backdrop, tinted toward the site navy so copy and glass stay legible. */}
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        <Image
          src="/images/flightdeck/runway-dusk.webp"
          alt=""
          fill
          priority
          loading="eager"
          fetchPriority="high"
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[#07111f]/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#07111f]/65 via-[#07111f]/15 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#07111f]/75 via-transparent to-[#07111f]/45" />
      </div>

      <div className="relative mx-auto grid w-full max-w-6xl gap-10 px-6 pb-16 pt-[calc(var(--public-header-height)+2.5rem)] md:px-10 lg:min-h-svh lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)] lg:items-center lg:gap-16 lg:pb-20 lg:pt-[calc(var(--public-header-height)+3rem)]">
        <section className="max-w-xl lg:pb-10">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/[0.10] bg-white/[0.06] px-3 py-1 font-mono text-xs uppercase [letter-spacing:0.22em] text-[var(--oc-aluminum)] backdrop-blur-md">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            AMG Connect · Approved Access
          </div>

          <h1 className="font-display text-5xl font-semibold uppercase tracking-tight text-white sm:text-6xl">
            Welcome
            <br />
            back.
          </h1>

          <p className="mt-5 max-w-md text-sm leading-6 text-[var(--oc-aluminum)]">
            Secure access for approved owners, crews, partners, and AMG
            administrators. Portal access is reviewed and approved by AMG.
          </p>

          <div className="mt-10 hidden gap-3 lg:grid lg:grid-cols-3">
            {accessPanels.map((panel) => {
              const Icon = panel.icon;

              return (
                <div
                  key={panel.title}
                  className="rounded-xl border border-white/[0.10] bg-white/[0.05] p-4 backdrop-blur-md"
                >
                  <Icon className="h-4 w-4 text-primary" />
                  <p className="mt-3 font-display text-sm font-semibold uppercase tracking-wide text-white">
                    {panel.title}
                  </p>
                  <p className="mt-1.5 text-xs leading-5 text-[var(--oc-aluminum)]">
                    {panel.body}
                  </p>
                </div>
              );
            })}
          </div>

          <p className="mt-8 hidden text-xs leading-5 text-[var(--oc-aluminum-2)] lg:block">
            Questions about access?{" "}
            <a
              href="mailto:information@amgaviationgroup.com?subject=AMG%20Connect%20portal%20access"
              className="text-[var(--instrument-ink)] underline-offset-4 hover:underline"
            >
              Contact AMG Operations
            </a>
          </p>
        </section>

        <section className="w-full lg:justify-self-end">
          <div className="rounded-2xl border border-white/[0.12] bg-white/[0.06] p-6 shadow-2xl backdrop-blur-2xl sm:p-8">
            <div
              className={cn(
                "mb-6 grid gap-1 rounded-full border border-white/[0.10] bg-white/[0.06] p-1",
                publicSignupEnabled ? "grid-cols-2" : "grid-cols-1",
              )}
            >
              <button
                type="button"
                onClick={() => setMode("signin")}
                aria-pressed={isSignIn}
                className={cn(
                  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition",
                  isSignIn
                    ? "bg-[var(--instrument)] text-white"
                    : "text-[var(--oc-aluminum)] hover:text-white"
                )}
              >
                <LogIn className="h-4 w-4" />
                Sign in
              </button>

              {publicSignupEnabled ? (
                <button
                  type="button"
                  onClick={() => setMode("request")}
                  aria-pressed={!isSignIn}
                  className={cn(
                    "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition",
                    !isSignIn
                      ? "bg-[var(--instrument)] text-white"
                      : "text-[var(--oc-aluminum)] hover:text-white"
                  )}
                >
                  <UserPlus className="h-4 w-4" />
                  Request access
                </button>
              ) : null}
            </div>

            {error ? (
              <div className="mb-4 rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-100">
                {ERROR_MESSAGES[error] ??
                  "Something went wrong. Please try again."}
              </div>
            ) : null}

            {success === "requested" ? (
              <div className="mb-4 rounded-xl border border-emerald-300/25 bg-emerald-500/10 px-4 py-3 text-sm leading-6 text-emerald-100">
                Access request submitted. AMG Operations will review and approve
                your account.
              </div>
            ) : null}

            {success === "password-reset" ? (
              <div className="mb-4 rounded-xl border border-emerald-300/25 bg-emerald-500/10 px-4 py-3 text-sm leading-6 text-emerald-100">
                Password created. Sign in with your AMG portal email and new
                login key.
              </div>
            ) : null}

            {error === "account_exists" ? (
              <div className="mb-4 grid gap-3 rounded-xl border border-white/[0.10] bg-white/[0.06] px-4 py-4">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => setMode("signin")}
                    className="inline-flex min-h-10 items-center justify-center rounded-full bg-[var(--instrument)] px-4 text-xs font-semibold uppercase text-white"
                  >
                    Sign in
                  </button>

                  <Link
                    href="/forgot-password"
                    className="inline-flex min-h-10 items-center justify-center rounded-full border border-white/15 px-4 text-xs font-semibold uppercase text-white/75 hover:border-primary hover:text-white"
                  >
                    Forgot password
                  </Link>

                  <a
                    href="mailto:information@amgaviationgroup.com?subject=AMG%20Connect%20account%20email%20issue"
                    className="inline-flex min-h-10 items-center justify-center rounded-full border border-white/15 px-4 text-xs font-semibold uppercase text-white/75 hover:border-primary hover:text-white"
                  >
                    Wrong email
                  </a>
                </div>
              </div>
            ) : null}

            {isSignIn || !publicSignupEnabled ? (
              <form action={signIn}>
                <div className="grid gap-2">
                  <label
                    htmlFor="email"
                    className="text-sm font-medium text-white/80"
                  >
                    Email
                  </label>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="name@company.com"
                    className="h-12 rounded-lg border border-white/[0.10] bg-white/[0.08] px-4 text-base text-white outline-none transition placeholder:text-[var(--oc-aluminum-2)] focus:border-primary"
                  />
                </div>

                <div className="mt-5 grid gap-2">
                  <div className="flex items-center justify-between gap-4">
                    <label
                      htmlFor="password"
                      className="text-sm font-medium text-white/80"
                    >
                      Password
                    </label>

                    <Link
                      href="/forgot-password"
                      className="text-sm text-[var(--instrument-ink)] underline-offset-4 hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Password"
                    className="h-12 rounded-lg border border-white/[0.10] bg-white/[0.08] px-4 text-base text-white outline-none transition placeholder:text-[var(--oc-aluminum-2)] focus:border-primary"
                  />
                </div>

                <button className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--instrument)] px-6 py-4 font-mono text-sm font-medium uppercase [letter-spacing:0.14em] text-white transition hover:bg-[var(--instrument)]/85">
                  Sign in
                  <ArrowRight className="h-4 w-4" />
                </button>

                <p className="mt-5 text-center text-xs leading-relaxed text-[var(--oc-aluminum-2)]">
                  Portal access is limited to approved users. Unauthorized
                  access is denied.
                </p>
              </form>
            ) : (
              <form action={signUp}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2 sm:col-span-2">
                    <label htmlFor="request-full-name" className="text-sm font-medium text-white/80">
                      Full name
                    </label>
                    <input
                      id="request-full-name"
                      name="full_name"
                      required
                      autoComplete="name"
                      placeholder="Jane Smith"
                      className="h-12 min-w-0 rounded-lg border border-white/[0.10] bg-white/[0.08] px-4 text-base text-white outline-none transition placeholder:text-[var(--oc-aluminum-2)] focus:border-primary"
                    />
                  </div>

                  <div className="grid gap-2 sm:col-span-2">
                    <label htmlFor="request-email" className="text-sm font-medium text-white/80">
                      Email
                    </label>
                    <input
                      id="request-email"
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="name@company.com"
                      className="h-12 min-w-0 rounded-lg border border-white/[0.10] bg-white/[0.08] px-4 text-base text-white outline-none transition placeholder:text-[var(--oc-aluminum-2)] focus:border-primary"
                    />
                  </div>

                  <label className="grid gap-2 text-sm font-medium text-white/80 md:col-span-2">
                    Business purpose
                    <select
                      name="business_purpose"
                      required
                      defaultValue=""
                      className="h-12 rounded-lg border border-white/[0.10] bg-white/[0.08] px-4 text-base text-white outline-none transition focus:border-primary"
                    >
                      <option value="" disabled className="text-[var(--oc-ink)]">
                        Select business purpose
                      </option>
                      {[
                        ["client", "Client"],
                        ["crew", "Crew"],
                        ["vendor", "Vendor"],
                        ["broker", "Broker"],
                        ["other", "Other"],
                      ].map(([value, label]) => (
                        <option key={value} value={value} className="text-[var(--oc-ink)]">
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="grid gap-2">
                    <label htmlFor="request-organization" className="text-sm font-medium text-white/80">
                      Organization
                    </label>
                    <input
                      id="request-organization"
                      name="company_name"
                      autoComplete="organization"
                      placeholder="Company or operator"
                      className="h-12 min-w-0 rounded-lg border border-white/[0.10] bg-white/[0.08] px-4 text-base text-white outline-none transition placeholder:text-[var(--oc-aluminum-2)] focus:border-primary"
                    />
                  </div>

                  <div className="grid gap-2">
                    <label htmlFor="request-phone" className="text-sm font-medium text-white/80">
                      Phone
                    </label>
                    <input
                      id="request-phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      placeholder="Optional"
                      className="h-12 min-w-0 rounded-lg border border-white/[0.10] bg-white/[0.08] px-4 text-base text-white outline-none transition placeholder:text-[var(--oc-aluminum-2)] focus:border-primary"
                    />
                  </div>
                </div>

                <button className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--instrument)] px-6 py-4 font-mono text-sm font-medium uppercase [letter-spacing:0.14em] text-white transition hover:bg-[var(--instrument)]/85">
                  Submit access request
                  <ArrowRight className="h-4 w-4" />
                </button>

                <p className="mt-4 text-center text-xs leading-relaxed text-[var(--oc-aluminum-2)]">
                  AMG reviews portal access requests before activation. Select the business purpose that best describes why you are requesting access.
                </p>
              </form>
            )}
          </div>

          <p className="mt-5 text-xs leading-5 text-[var(--oc-aluminum-2)]">
            Portal visibility does not replace operational approval, crew
            confirmation, aircraft status review, or final support acceptance.
          </p>
        </section>
      </div>
    </div>
  );
}
