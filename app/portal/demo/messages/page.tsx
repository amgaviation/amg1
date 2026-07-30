import Link from "next/link";
import { requireRole } from "@/lib/portal/session";
import { PageHeader, SectionCard } from "@/components/portal/ui/primitives";
import { LocalTime } from "@/components/portal/ui/local-time";
import { cn } from "@/lib/utils";
import { DEMO_THREADS, demoHoursAgo } from "@/lib/demo/data";

export const metadata = { title: "Messages - Demo Portal" };

export default async function DemoMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ thread?: string }>;
}) {
  await requireRole("demo");
  const { thread: threadParam } = await searchParams;
  const activeThread =
    DEMO_THREADS.find((thread) => thread.id === threadParam) ?? DEMO_THREADS[0];

  return (
    <>
      <PageHeader
        eyebrow="Demo Sandbox"
        title="Messages"
        description="Simulated portal conversations with clients, contract crew, and FBO partners."
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,22rem)_1fr]">
        {/* Thread list */}
        <SectionCard title="Threads" icon="messageSquare" className="min-w-0">
          <div className="space-y-2">
            {DEMO_THREADS.map((thread) => {
              const last = thread.messages[thread.messages.length - 1];
              const active = thread.id === activeThread.id;
              return (
                <Link
                  key={thread.id}
                  href={`/portal/demo/messages?thread=${thread.id}`}
                  className={cn(
                    "block rounded-[calc(var(--radius)-2px)] border p-3.5 transition-colors",
                    active
                      ? "border-[var(--deck-accent-line)] bg-[var(--deck-accent-tint)]"
                      : "border-[var(--deck-line)] bg-[var(--deck-panel)] hover:border-[var(--deck-accent-line)]"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="min-w-0 truncate text-sm font-semibold text-[var(--deck-text)]">
                      {thread.subject}
                    </p>
                    {thread.unread ? (
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[var(--deck-accent)]" aria-label="Unread" />
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-[var(--deck-text-3)]">{thread.counterpartRole}</p>
                  <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-[var(--deck-text-2)]">
                    {last.body}
                  </p>
                  <p className="deck-mono mt-1.5 text-[var(--deck-text-3)]">
                    <LocalTime value={demoHoursAgo(last.hoursAgo)} />
                  </p>
                </Link>
              );
            })}
          </div>
        </SectionCard>

        {/* Active conversation */}
        <SectionCard
          title={activeThread.subject}
          description={activeThread.counterpartRole}
          icon="messageSquare"
          className="min-w-0"
        >
          <div className="space-y-3">
            {activeThread.messages.map((message, index) => {
              const outbound = message.from === "AMG Operations";
              return (
                <div
                  key={index}
                  className={cn(
                    "max-w-[46rem] rounded-[calc(var(--radius)-2px)] border p-4",
                    outbound
                      ? "ml-auto border-[var(--deck-accent-line)] bg-[var(--deck-accent-tint)]"
                      : "border-[var(--deck-line)] bg-[var(--deck-panel)]"
                  )}
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <p className="text-xs font-semibold text-[var(--deck-text)]">{message.from}</p>
                    <span className="deck-mono text-[var(--deck-text-3)]">
                      <LocalTime value={demoHoursAgo(message.hoursAgo)} />
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[var(--deck-text-2)]">{message.body}</p>
                </div>
              );
            })}
            <p className="pt-2 text-xs text-[var(--deck-text-3)]">
              Replying is disabled in the demo sandbox — these conversations are simulated.
            </p>
          </div>
        </SectionCard>
      </div>
    </>
  );
}
