"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, BadgeCheck, FileText, LogIn, ShieldCheck, UserPlus } from "lucide-react";
import { signIn, signUp } from "@/app/portal/actions/auth";
import { cn } from "@/lib/utils";

const ERROR_MESSAGES: Record<string, string> = {
  missing: "Enter your email and password.",
  invalid: "Email or password is incorrect.",
  pending: "Your access request is awaiting AMG approval.",
  suspended: "This account has been suspended. Contact AMG Operations.",
  signup: "We couldn't create that account. The email may already be in use.",
  weakpassword: "Password must be at least 8 characters.",
  account_exists:
    "An AMG portal account already exists for that email. Sign in, use Forgot Password, or contact AMG if you used the wrong email.",
};

const accessPanels = [
  {
    title: "Client",
    body: "Support requests, aircraft profiles, quotes, documents, billing, subscriptions, and messages.",
    icon: FileText,
  },
  {
    title: "Crew",
    body: "Assignments, credentials, availability, expenses, mission details, and AMG communication.",
    icon: BadgeCheck,
  },
  {
    title: "Operations",
    body: "AMG admin, partner coordination, access review, records, and support workflow oversight.",
    icon: ShieldCheck,
  },
];

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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const isSignIn = mode === "signin";

  return (
    <div className="login-cinema relative isolate grid min-h-[100svh] grid-cols-1 overflow-hidden bg-background pt-[var(--public-header-height)] lg:grid-cols-[1.12fr_0.88fr]">
      <section className="relative hidden items-end overflow-hidden p-10 lg:flex">
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/site/map-operations.jpg" alt="" className="h-full w-full scale-105 object-cover opacity-60" data-parallax="0.05" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_20%,rgba(56,189,248,0.2),transparent_26rem)]" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/60 to-background/10" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/20" />
        </div>
        <div className="relative max-w-3xl" data-scroll-animate>
          <Link href="/" className="eyebrow mb-7 inline-flex items-center gap-3 text-accent" data-cursor="HOME">
            <span className="h-px w-10 bg-accent/70" />
            AMG Aviation Group
          </Link>
          <h1 className="display-heading text-balance text-7xl text-foreground xl:text-8xl">
            Secure access for the operating network
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Owners, flight crew, AMG operations, and approved service partners
            coordinate every mission through one secure operations platform.
          </p>
          <div className="mt-12 grid max-w-4xl grid-cols-3 gap-3">
            {accessPanels.map((panel) => {
              const Icon = panel.icon;
              return (
                <div key={panel.title} className="glass-panel min-h-48 rounded-lg p-5">
                  <Icon className="h-5 w-5 text-accent" />
                  <p className="mt-6 font-display text-2xl font-bold uppercase leading-none text-foreground">
                    {panel.title}
                  </p>
                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{panel.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="cinematic-band flex items-center px-6 py-12 sm:px-10 lg:px-12">
        <div className="mx-auto w-full max-w-[34rem]">
          <div className="mb-8">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-6 w-6 text-accent" />
              <p className="eyebrow text-accent">AMG Connect Access</p>
            </div>
            <h2 className="mt-5 display-heading text-balance text-5xl text-foreground sm:text-6xl">
              {isSignIn ? "Enter the portal" : "Request portal access"}
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {isSignIn
                ? "Sign in with your approved AMG portal credentials. The system routes client, crew, partner, and admin users by role."
                : "Submit an access request for AMG Operations review. Approved accounts receive role-based portal access."}
            </p>
          </div>

          <div className="login-mode-switch mb-6 grid grid-cols-2 gap-1 rounded-full border border-white/10 bg-white/5 p-1 backdrop-blur">
            <button
              type="button"
              onClick={() => setMode("signin")}
              aria-pressed={isSignIn}
              className={cn(
                "inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                isSignIn ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
              data-cursor="ENTER"
            >
              <LogIn className="h-4 w-4" /> Sign in
            </button>
            <button
              type="button"
              onClick={() => setMode("request")}
              aria-pressed={!isSignIn}
              className={cn(
                "inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                !isSignIn ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
              data-cursor="REQUEST"
            >
              <UserPlus className="h-4 w-4" /> Request access
            </button>
          </div>

          {error ? (
            <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-red-200">
              {ERROR_MESSAGES[error] ?? "Something went wrong. Please try again."}
            </div>
          ) : null}
          {success === "requested" ? (
            <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              Access request submitted. AMG Operations will review and approve your account.
            </div>
          ) : null}
          {success === "password-reset" ? (
            <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              Password created. Sign in with your AMG portal email and new login key.
            </div>
          ) : null}
          {error === "account_exists" ? (
            <div className="glass-panel mb-4 grid gap-3 rounded-lg px-4 py-4">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => setMode("signin")}
                  className="inline-flex min-h-10 items-center justify-center rounded-full bg-primary px-4 text-xs font-semibold uppercase tracking-widest text-primary-foreground"
                >
                  Sign in
                </button>
                <Link
                  href="/forgot-password"
                  className="inline-flex min-h-10 items-center justify-center rounded-full border border-white/15 px-4 text-xs font-semibold uppercase tracking-widest text-foreground hover:border-accent hover:text-accent"
                >
                  Forgot password
                </Link>
                <Link
                  href="/contact?category=other-support"
                  className="inline-flex min-h-10 items-center justify-center rounded-full border border-white/15 px-4 text-xs font-semibold uppercase tracking-widest text-foreground hover:border-accent hover:text-accent"
                >
                  Wrong email
                </Link>
              </div>
            </div>
          ) : null}

          {isSignIn ? (
            <form action={signIn} className="portal-entry-card glass-panel rounded-lg p-6 sm:p-8">
              <label className="eyebrow text-[0.7rem] text-muted-foreground" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="support-field mt-2 h-12 w-full px-4 text-base"
                data-cursor="TYPE"
              />
              <div className="mt-5 flex items-center justify-between gap-4">
                <label className="eyebrow block text-[0.7rem] text-muted-foreground" htmlFor="password">
                  Password
                </label>
                <Link href="/forgot-password" className="text-xs text-accent hover:text-foreground" data-cursor="OPEN">
                  Forgot password
                </Link>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="support-field mt-2 h-12 w-full px-4 text-base"
                data-cursor="TYPE"
              />
              <button className="magnetic-link mt-7 inline-flex w-full min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 py-4 font-display text-sm font-semibold uppercase tracking-widest text-primary-foreground transition-colors hover:bg-primary/90" data-cursor="ENTER">
                Sign in
                <ArrowRight className="h-4 w-4" />
              </button>
              <p className="mt-5 text-center text-xs leading-relaxed text-muted-foreground">
                Portal access is limited to approved users. Unauthorized access is denied.
              </p>
            </form>
          ) : (
            <form action={signUp} className="portal-entry-card glass-panel rounded-lg p-6 sm:p-8">
              <div className="grid gap-4">
                <label className="grid gap-2 text-sm font-medium text-foreground/90">
                  Full name <span className="sr-only">required</span>
                  <input name="full_name" required autoComplete="name" className="support-field h-12 px-4 text-base" data-cursor="TYPE" />
                </label>
                <label className="grid gap-2 text-sm font-medium text-foreground/90">
                  Email <span className="text-accent">*</span>
                  <input name="email" type="email" required autoComplete="email" className="support-field h-12 px-4 text-base" data-cursor="TYPE" />
                </label>
                <label className="grid gap-2 text-sm font-medium text-foreground/90">
                  Create password <span className="text-accent">*</span>
                  <input name="password" type="password" required minLength={8} autoComplete="new-password" className="support-field h-12 px-4 text-base" data-cursor="TYPE" />
                </label>
                <input type="hidden" name="role" value="client" />
                <label className="grid gap-2 text-sm font-medium text-foreground/90">
                  Organization
                  <input name="company_name" autoComplete="organization" className="support-field h-12 px-4 text-base" data-cursor="TYPE" />
                </label>
                <label className="grid gap-2 text-sm font-medium text-foreground/90">
                  Phone
                  <input name="phone" type="tel" autoComplete="tel" className="support-field h-12 px-4 text-base" data-cursor="TYPE" />
                </label>
              </div>
              <button className="magnetic-link mt-6 inline-flex w-full min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 py-4 font-display text-sm font-semibold uppercase tracking-widest text-primary-foreground transition-colors hover:bg-primary/90" data-cursor="REQUEST">
                Submit access request
                <ArrowRight className="h-4 w-4" />
              </button>
              <p className="mt-4 text-center text-xs leading-relaxed text-muted-foreground">
                AMG Operations reviews and approves every account before activation.
              </p>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
