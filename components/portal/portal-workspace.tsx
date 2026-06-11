import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Database,
  FileText,
  LockKeyhole,
  MessageSquareText,
  RadioTower,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getPortalRole,
  permissionMatrix,
  portalNav,
  portalRoles,
  systemModules,
  type PortalQueueItem,
  type PortalRole,
} from "@/lib/portal-data";
import { cn } from "@/lib/utils";

function priorityTone(priority: PortalQueueItem["priority"]) {
  if (priority === "Critical") return "border-destructive/60 bg-destructive/10 text-white";
  if (priority === "High") return "border-primary/60 bg-primary/10 text-white";
  return "border-border bg-secondary text-secondary-foreground";
}

export function PortalWorkspace({ role }: { role: PortalRole }) {
  const config = getPortalRole(role);
  const Icon = config.icon;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 -z-10">
          <Image src={config.image} alt="" fill priority className="object-cover opacity-20" sizes="100vw" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/92 to-background" />
        </div>

        <div className="mx-auto flex max-w-7xl flex-col gap-10 px-6 py-8 lg:px-10">
          <header className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <Link href="/login" className="inline-flex items-center gap-3 text-sm text-muted-foreground hover:text-accent">
              <LockKeyhole className="h-4 w-4" />
              AMG Connect Access
            </Link>
            <nav aria-label="Portal roles" className="flex flex-wrap gap-2">
              {portalNav.map((item) => (
                <Button
                  key={item.id}
                  asChild
                  variant={item.id === role ? "default" : "outline"}
                  size="sm"
                  className="rounded-full"
                >
                  <Link href={item.href}>{item.title}</Link>
                </Button>
              ))}
            </nav>
          </header>

          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <div className="mb-5 inline-flex items-center gap-3 rounded-full border border-border bg-card/70 px-4 py-2">
                <Icon className="h-4 w-4 text-accent" />
                <span className="eyebrow text-[0.68rem] text-accent">{config.shortTitle} Operations</span>
              </div>
              <h1 className="font-display text-5xl font-extrabold uppercase leading-none text-foreground sm:text-6xl lg:text-7xl">
                {config.title}
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-muted-foreground sm:text-lg">
                {config.summary}
              </p>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">{config.access}</p>
            </div>

            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border">
              {config.metrics.map((metric) => (
                <div key={metric.label} className="min-h-32 bg-card p-5">
                  <p className="font-display text-4xl font-extrabold uppercase leading-none">{metric.value}</p>
                  <p className="eyebrow mt-3 text-[0.62rem] text-accent">{metric.label}</p>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">{metric.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[0.72fr_1.28fr] lg:px-10">
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="eyebrow text-[0.64rem] text-accent">{config.queueTitle}</p>
              <h2 className="mt-2 font-display text-2xl font-bold uppercase">Priority work</h2>
            </div>
            <RadioTower className="h-5 w-5 text-accent" />
          </div>

          <div className="mt-5 space-y-3">
            {config.queue.map((item) => (
              <article key={item.id} className="rounded-lg border border-border bg-background/50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-xs text-muted-foreground">{item.id}</p>
                    <h3 className="mt-1 text-sm font-semibold leading-6 text-foreground">{item.title}</h3>
                  </div>
                  <Badge variant="outline" className={cn("shrink-0", priorityTone(item.priority))}>
                    {item.priority}
                  </Badge>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                  <span>{item.owner}</span>
                  <span className="text-right">{item.due}</span>
                </div>
                <p className="mt-2 text-xs text-accent">{item.status}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="eyebrow text-[0.64rem] text-accent">{config.recordsTitle}</p>
              <h2 className="mt-2 font-display text-2xl font-bold uppercase">Operational records</h2>
            </div>
            <Button variant="outline" size="sm" className="rounded-full">
              <ArrowRight className="h-4 w-4" />
              Open record
            </Button>
          </div>

          <div className="mt-5 overflow-hidden rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-background/60">
                  <TableHead>Reference</TableHead>
                  <TableHead>Aircraft</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Next</TableHead>
                  <TableHead>Owner</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {config.records.map((record) => (
                  <TableRow key={record.ref}>
                    <TableCell className="font-mono text-xs text-accent">{record.ref}</TableCell>
                    <TableCell>{record.aircraft}</TableCell>
                    <TableCell>{record.route}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{record.stage}</Badge>
                    </TableCell>
                    <TableCell>{record.nextAction}</TableCell>
                    <TableCell>{record.assigned}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 pb-8 lg:grid-cols-[1fr_1fr] lg:px-10">
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="mb-5 flex items-center gap-3">
            <FileText className="h-5 w-5 text-accent" />
            <h2 className="font-display text-2xl font-bold uppercase">Documents and data</h2>
          </div>
          <div className="space-y-3">
            {config.documents.map((document) => (
              <div key={document.name} className="grid gap-3 rounded-lg border border-border bg-background/50 p-4 sm:grid-cols-[1.2fr_0.8fr_0.8fr]">
                <div>
                  <p className="text-sm font-semibold">{document.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{document.scope}</p>
                </div>
                <p className="text-xs leading-5 text-muted-foreground">{document.visibility}</p>
                <Badge variant="secondary" className="justify-self-start">
                  {document.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <div className="mb-5 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-accent" />
            <h2 className="font-display text-2xl font-bold uppercase">Workflow path</h2>
          </div>
          <div className="grid gap-3">
            {config.workflow.map((item) => (
              <article key={item.step} className="grid grid-cols-[3rem_1fr] gap-4 rounded-lg border border-border bg-background/50 p-4">
                <span className="font-display text-3xl font-extrabold text-accent">{item.step}</span>
                <div>
                  <h3 className="font-display text-xl font-bold uppercase">{item.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-12 lg:px-10">
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="eyebrow text-[0.64rem] text-accent">Permissions</p>
              <h2 className="mt-2 font-display text-2xl font-bold uppercase">Role modules</h2>
            </div>
            <MessageSquareText className="h-5 w-5 text-accent" />
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {config.modules.map((module) => (
              <article key={module.name} className="rounded-lg border border-border bg-background/50 p-4">
                <h3 className="font-display text-xl font-bold uppercase">{module.name}</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {module.permissions.map((permission) => (
                    <Badge key={permission} variant="outline">
                      {permission}
                    </Badge>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

export function PortalSystemOverview() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="relative overflow-hidden border-b border-border px-6 py-8 lg:px-10">
        <div className="absolute inset-0 -z-10">
          <Image src="/images/operations.png" alt="" fill priority className="object-cover opacity-20" sizes="100vw" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/90 to-background" />
        </div>

        <div className="mx-auto max-w-7xl">
          <header className="flex items-center justify-between gap-4">
            <Link href="/login" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-accent">
              <LockKeyhole className="h-4 w-4" />
              Login
            </Link>
            <Link href="/" className="eyebrow text-[0.68rem] text-accent">
              AMG Aviation
            </Link>
          </header>

          <div className="mt-20 max-w-4xl">
            <p className="eyebrow mb-5 text-accent">AMG Connect</p>
            <h1 className="font-display text-5xl font-extrabold uppercase leading-none text-foreground sm:text-6xl lg:text-7xl">
              Operational portal system
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">
              Role-based operating rooms for aircraft owners, pilots and crew, AMG administrators, and approved aviation partners.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-8 md:grid-cols-2 xl:grid-cols-4 lg:px-10">
        {portalRoles.map((role) => {
          const Icon = role.icon;
          return (
            <article key={role.id} className="rounded-lg border border-border bg-card p-5">
              <Icon className="h-6 w-6 text-accent" />
              <h2 className="mt-5 font-display text-2xl font-bold uppercase">{role.title}</h2>
              <p className="mt-3 min-h-24 text-sm leading-6 text-muted-foreground">{role.access}</p>
              <Button asChild className="mt-5 w-full rounded-full">
                <Link href={role.href}>
                  Open workspace
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </article>
          );
        })}
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 pb-8 lg:grid-cols-[0.95fr_1.05fr] lg:px-10">
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="mb-5 flex items-center gap-3">
            <Database className="h-5 w-5 text-accent" />
            <h2 className="font-display text-2xl font-bold uppercase">System modules</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {systemModules.map((module) => {
              const Icon = module.icon;
              return (
                <article key={module.name} className="rounded-lg border border-border bg-background/50 p-4">
                  <Icon className="h-5 w-5 text-accent" />
                  <h3 className="mt-3 text-sm font-semibold">{module.name}</h3>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">{module.body}</p>
                </article>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <div className="mb-5 flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-accent" />
            <h2 className="font-display text-2xl font-bold uppercase">Permission model</h2>
          </div>
          <div className="overflow-hidden rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-background/60">
                  <TableHead>Module</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Crew</TableHead>
                  <TableHead>Partner</TableHead>
                  <TableHead>Admin</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {permissionMatrix.map((row) => (
                  <TableRow key={row.module}>
                    <TableCell className="font-semibold">{row.module}</TableCell>
                    <TableCell>{row.client}</TableCell>
                    <TableCell>{row.crew}</TableCell>
                    <TableCell>{row.partner}</TableCell>
                    <TableCell>{row.admin}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </section>
    </main>
  );
}
