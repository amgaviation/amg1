"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { PORTAL_ROLES } from "@/lib/content";
import { cn } from "@/lib/utils";

export function PortalLogin() {
  const router = useRouter();
  const [role, setRole] = useState<(typeof PORTAL_ROLES)[number]["id"]>("client");

  const selected = PORTAL_ROLES.find((item) => item.id === role) ?? PORTAL_ROLES[0];

  return (
    <div className="grid min-h-screen grid-cols-1 bg-background lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative flex min-h-[58vh] items-end overflow-hidden p-6 lg:min-h-screen lg:p-10">
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/operations.png" alt="" className="h-full w-full object-cover opacity-45" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/65 to-background/20" />
        </div>
        <div className="relative max-w-3xl">
          <p className="eyebrow mb-5 text-accent">AMG Connect</p>
          <h1 className="display-heading text-balance text-6xl text-foreground sm:text-7xl lg:text-8xl">
            Login for every side of the mission
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Clients, crew, and AMG admins enter through one secure access point and land in the portal built for their role.
          </p>
        </div>
      </section>

      <section className="flex items-center px-6 py-14 lg:px-12">
        <div className="w-full">
          <div className="mb-8 flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-accent" />
            <p className="eyebrow text-accent">Role Access</p>
          </div>

          <div className="grid gap-3">
            {PORTAL_ROLES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setRole(item.id)}
                className={cn(
                  "rounded-xl border p-5 text-left transition-colors",
                  role === item.id
                    ? "border-accent bg-accent/10"
                    : "border-border bg-card hover:border-accent/60"
                )}
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-foreground">
                      {item.title}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">{item.access}</p>
                  </div>
                  <ArrowRight className={cn("h-5 w-5", role === item.id ? "text-accent" : "text-muted-foreground")} />
                </div>
              </button>
            ))}
          </div>

          <form
            className="mt-8 rounded-xl border border-border bg-card p-6"
            onSubmit={(event) => {
              event.preventDefault();
              router.push(selected.href);
            }}
          >
            <label className="eyebrow text-[0.7rem] text-muted-foreground" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              placeholder="name@company.com"
              className="mt-2 h-12 w-full rounded-lg border border-input bg-background px-4 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-accent"
            />
            <label className="eyebrow mt-5 block text-[0.7rem] text-muted-foreground" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              placeholder="Password"
              className="mt-2 h-12 w-full rounded-lg border border-input bg-background px-4 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-accent"
            />
            <button className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-4 font-display text-sm font-semibold uppercase tracking-widest text-primary-foreground transition-colors hover:bg-primary/90">
              Enter {selected.title}
              <ArrowRight className="h-4 w-4" />
            </button>
            <p className="mt-4 text-center text-xs leading-relaxed text-muted-foreground">
              Need access? Submit a request and AMG Operations will review your role.
            </p>
          </form>
        </div>
      </section>
    </div>
  );
}
