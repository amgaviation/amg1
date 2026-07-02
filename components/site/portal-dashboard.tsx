import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CalendarDays, CheckCircle2, FileText, Plane, ShieldCheck, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS = {
  calendar: CalendarDays,
  check: CheckCircle2,
  file: FileText,
  plane: Plane,
  shield: ShieldCheck,
  users: Users,
};

export function PortalDashboard({
  role,
  eyebrow,
  title,
  description,
  image,
  metrics,
  panels,
}: {
  role: string;
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  metrics: Array<{ label: string; value: string }>;
  panels: Array<{ title: string; body: string; icon: keyof typeof ICONS; tone?: "accent" | "muted" }>;
}) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="relative overflow-hidden border-b border-border px-6 pb-16 pt-8 lg:px-10">
        <div className="absolute inset-0 -z-10">
          <Image src={image} alt="" fill priority loading="eager" fetchPriority="high" sizes="100vw" className="object-cover opacity-25" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/85 to-background/60" />
        </div>
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-between gap-4">
            <Link href="/login" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-accent">
              <ArrowLeft className="h-4 w-4" />
              Login
            </Link>
            <Link href="/" className="eyebrow text-[0.7rem] text-accent">
              AMG Aviation
            </Link>
          </div>
          <div className="mt-24 max-w-5xl">
            <p className="eyebrow mb-5 text-accent">{eyebrow}</p>
            <h1 className="display-heading text-balance text-6xl text-foreground sm:text-7xl lg:text-8xl">{title}</h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">{description}</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border lg:grid-cols-4">
          {metrics.map((metric) => (
            <div key={metric.label} className="bg-card p-6">
              <p className="font-display text-4xl font-extrabold text-foreground">{metric.value}</p>
              <p className="eyebrow mt-2 text-[0.62rem] text-muted-foreground">{metric.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {panels.map((panel) => {
            const Icon = ICONS[panel.icon];
            return (
              <article key={panel.title} className="rounded-xl border border-border bg-card p-6">
                <Icon className={cn("h-6 w-6", panel.tone === "muted" ? "text-muted-foreground" : "text-accent")} />
                <h2 className="mt-6 font-display text-2xl font-bold uppercase tracking-wide text-foreground">{panel.title}</h2>
                <p className="mt-3 leading-relaxed text-muted-foreground">{panel.body}</p>
              </article>
            );
          })}
        </div>

        <div className="mt-10 rounded-xl border border-border bg-card p-6">
          <p className="eyebrow text-accent">{role} Portal Preview</p>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            This screen is ready for backend authentication and live data. The route structure is in place now so production data sources can be connected without redesigning the experience.
          </p>
        </div>
      </section>
    </main>
  );
}
