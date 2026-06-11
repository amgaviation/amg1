"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, LogIn, UserPlus } from "lucide-react";
import { signIn, signUp } from "@/app/portal/actions/auth";
import { REQUESTABLE_ROLES } from "@/lib/portal/constants";
import { cn } from "@/lib/utils";

const DEMO_ACCOUNTS = [
  { role: "Admin", email: "admin@amg.demo", desc: "Operations command center" },
  { role: "Client", email: "client@amg.demo", desc: "Owner / aircraft representative" },
  { role: "Crew", email: "crew@amg.demo", desc: "Pilot & contract crew" },
  { role: "Partner", email: "partner@amg.demo", desc: "FBO / vendor services" },
];

const DEMO_PASSWORD = "AmgDemo2025!";

const ERROR_MESSAGES: Record<string, string> = {
  missing: "Enter your email and password.",
  invalid: "Email or password is incorrect.",
  pending: "Your access request is awaiting AMG approval.",
  suspended: "This account has been suspended. Contact AMG Operations.",
  signup: "We couldn't create that account. The email may already be in use.",
  weakpassword: "Password must be at least 8 characters.",
};

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

  function fillDemo(demoEmail: string) {
    setMode("signin");
    setEmail(demoEmail);
    setPassword(DEMO_PASSWORD);
  }

  return (
    <div className="grid min-h-screen grid-cols-1 bg-background lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden items-end overflow-hidden p-10 lg:flex">
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/operations.png" alt="" className="h-full w-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/20" />
        </div>
        <div className="relative max-w-xl">
          <Link href="/" className="eyebrow mb-6 inline-block text-accent">
            ← AMG Aviation Group
          </Link>
          <h1 className="display-heading text-balance text-6xl text-foreground lg:text-7xl">
            Operational control for private aviation
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
            Owners, flight crew, AMG operations, and approved service partners
            coordinate every mission through one secure operations platform.
          </p>
        </div>
      </section>

      <section className="flex items-center px-6 py-12 sm:px-10 lg:px-12">
        <div className="w-full max-w-md">
          <div className="mb-7 flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-accent" />
            <p className="eyebrow text-accent">AMG Connect Access</p>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-1 rounded-full border border-border bg-card p-1">
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={cn(
                "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                mode === "signin" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              )}
            >
              <LogIn className="h-4 w-4" /> Sign in
            </button>
            <button
              type="button"
              onClick={() => setMode("request")}
              className={cn(
                "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                mode === "request" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              )}
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

          {mode === "signin" ? (
            <form action={signIn} className="rounded-xl border border-border bg-card p-6">
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
                className="mt-2 h-12 w-full rounded-lg border border-input bg-background px-4 text-base outline-none focus:border-accent"
              />
              <label className="eyebrow mt-5 block text-[0.7rem] text-muted-foreground" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="mt-2 h-12 w-full rounded-lg border border-input bg-background px-4 text-base outline-none focus:border-accent"
              />
              <button className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-4 font-display text-sm font-semibold uppercase tracking-widest text-primary-foreground transition-colors hover:bg-primary/90">
                Sign in
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          ) : (
            <form action={signUp} className="rounded-xl border border-border bg-card p-6">
              <div className="grid gap-3">
                <input name="full_name" required placeholder="Full name" className="h-11 rounded-lg border border-input bg-background px-4 text-sm outline-none focus:border-accent" />
                <input name="email" type="email" required placeholder="name@company.com" className="h-11 rounded-lg border border-input bg-background px-4 text-sm outline-none focus:border-accent" />
                <input name="password" type="password" required minLength={8} placeholder="Create a password (8+ characters)" className="h-11 rounded-lg border border-input bg-background px-4 text-sm outline-none focus:border-accent" />
                <div className="grid grid-cols-2 gap-3">
                  <select name="role" required defaultValue="client" className="h-11 rounded-lg border border-input bg-background px-4 text-sm outline-none focus:border-accent">
                    {REQUESTABLE_ROLES.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                  <input name="company_name" placeholder="Organization" className="h-11 rounded-lg border border-input bg-background px-4 text-sm outline-none focus:border-accent" />
                </div>
                <input name="phone" placeholder="Phone (optional)" className="h-11 rounded-lg border border-input bg-background px-4 text-sm outline-none focus:border-accent" />
              </div>
              <button className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-4 font-display text-sm font-semibold uppercase tracking-widest text-primary-foreground transition-colors hover:bg-primary/90">
                Submit access request
                <ArrowRight className="h-4 w-4" />
              </button>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                AMG Operations reviews and approves every account before activation.
              </p>
            </form>
          )}

          <div className="mt-6 rounded-xl border border-dashed border-border bg-card/50 p-5">
            <p className="eyebrow text-[0.62rem] text-accent">Demo accounts</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Click to fill — password <span className="font-mono text-foreground">{DEMO_PASSWORD}</span>
            </p>
            <div className="mt-3 grid gap-2">
              {DEMO_ACCOUNTS.map((acct) => (
                <button
                  key={acct.email}
                  type="button"
                  onClick={() => fillDemo(acct.email)}
                  className="flex items-center justify-between rounded-lg border border-border bg-background/60 px-3 py-2 text-left transition-colors hover:border-accent"
                >
                  <span>
                    <span className="text-sm font-semibold text-foreground">{acct.role}</span>
                    <span className="ml-2 font-mono text-xs text-muted-foreground">{acct.email}</span>
                  </span>
                  <span className="text-[0.7rem] text-muted-foreground">{acct.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
