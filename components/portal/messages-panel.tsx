import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type PortalSession } from "@/lib/portal-session";
import { postMessage } from "@/app/portal/message-actions";
import Link from "next/link";
import { ArrowLeft, MessageSquareText } from "lucide-react";

type Props = { session: PortalSession };

export async function MessagesPanel({ session }: Props) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let threads: {
    id: string;
    scope_type: string;
    title: string | null;
    created_at: string;
  }[] = [];

  let messages: {
    id: string;
    thread_id: string;
    body: string;
    sender_email: string | null;
    created_at: string;
  }[] = [];

  if (user) {
    // Get threads where user is a member (or admin sees all)
    const { data: memberThreads } = await supabase
      .from("thread_members")
      .select("thread_id")
      .eq("profile_id", user.id);

    const threadIds = (memberThreads ?? []).map((m) => m.thread_id);

    if (threadIds.length > 0) {
      const { data: t } = await supabase
        .from("message_threads")
        .select("id, scope_type, title, created_at")
        .in("id", threadIds)
        .order("created_at", { ascending: false });
      threads = t ?? [];

      const { data: m } = await supabase
        .from("messages")
        .select("id, thread_id, body, sender_email, created_at")
        .in("thread_id", threadIds)
        .order("created_at", { ascending: false })
        .limit(50);
      messages = m ?? [];
    }
  }

  const backHref = `/portal/${session.role}`;

  const messagesByThread = messages.reduce<Record<string, typeof messages>>((acc, msg) => {
    if (!acc[msg.thread_id]) acc[msg.thread_id] = [];
    acc[msg.thread_id].push(msg);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-8">
        <div className="flex items-center gap-4">
          <Link
            href={backHref}
            className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Portal
          </Link>
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Messages</h1>
          <p className="text-muted-foreground text-sm">Your scoped communication threads.</p>
        </div>

        {threads.length === 0 ? (
          <div className="border border-border rounded-lg p-12 text-center space-y-2">
            <MessageSquareText className="w-8 h-8 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground text-sm">
              No message threads yet. AMG Operations will open threads as needed.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {threads.map((thread) => {
              const threadMessages = messagesByThread[thread.id] ?? [];
              return (
                <div key={thread.id} className="border border-border rounded-lg overflow-hidden">
                  {/* Thread header */}
                  <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-secondary/30">
                    <div className="space-y-0.5">
                      <p className="font-medium text-sm">
                        {thread.title ?? `Thread — ${thread.id.slice(0, 8)}`}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">{thread.scope_type}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {threadMessages.length} message{threadMessages.length !== 1 ? "s" : ""}
                    </Badge>
                  </div>

                  {/* Messages */}
                  <div className="divide-y divide-border max-h-64 overflow-y-auto">
                    {threadMessages.slice().reverse().map((msg) => (
                      <div key={msg.id} className="px-5 py-3 space-y-1">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-xs font-mono text-muted-foreground">
                            {msg.sender_email ?? "AMG"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Intl.DateTimeFormat("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            }).format(new Date(msg.created_at))}
                          </span>
                        </div>
                        <p className="text-sm">{msg.body}</p>
                      </div>
                    ))}
                  </div>

                  {/* Reply form */}
                  <form
                    action={postMessage}
                    className="px-5 py-4 border-t border-border flex gap-3"
                  >
                    <input type="hidden" name="thread_id" value={thread.id} />
                    <input
                      name="body"
                      required
                      placeholder="Type a message..."
                      className="flex-1 bg-secondary border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <Button type="submit" size="sm">
                      Send
                    </Button>
                  </form>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
