"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PortalIcon } from "@/components/portal/ui/icon";

/**
 * Owner controls for the Pilot Health workspace: connect, sync, disconnect.
 * The buttons only talk to the private /api/pilot-health endpoints, which
 * re-check ownership server-side on every request.
 */
export function PilotHealthControls({
  connected,
  lastSyncedAt,
}: {
  connected: boolean;
  lastSyncedAt: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<"sync" | "disconnect" | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function post(path: string): Promise<{ ok: boolean; error?: string }> {
    try {
      const response = await fetch(path, { method: "POST" });
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        return { ok: false, error: body?.error ?? "Request failed. Try again." };
      }
      return { ok: true };
    } catch {
      return { ok: false, error: "Network error. Try again." };
    }
  }

  async function handleSync() {
    setBusy("sync");
    setMessage(null);
    const result = await post("/api/pilot-health/oura/sync");
    setBusy(null);
    if (result.ok) {
      setMessage("Sync complete.");
      router.refresh();
    } else {
      setMessage(result.error ?? "Sync failed.");
    }
  }

  async function handleDisconnect() {
    if (
      !window.confirm(
        "Disconnect Oura? Stored tokens and all imported health metrics will be deleted."
      )
    ) {
      return;
    }
    setBusy("disconnect");
    setMessage(null);
    const result = await post("/api/pilot-health/oura/disconnect");
    setBusy(null);
    if (result.ok) {
      setMessage("Disconnected.");
      router.refresh();
    } else {
      setMessage(result.error ?? "Disconnect failed.");
    }
  }

  const lastSynced = lastSyncedAt
    ? new Date(lastSyncedAt).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "UTC",
        hour12: false,
      }) + " UTC"
    : null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {message ? (
        <span role="status" className="text-xs text-[var(--deck-text-3)]">
          {message}
        </span>
      ) : lastSynced ? (
        <span className="text-xs text-[var(--deck-text-3)]">Last sync {lastSynced}</span>
      ) : null}
      {connected ? (
        <>
          <button
            type="button"
            onClick={handleSync}
            disabled={busy !== null}
            className="inline-flex items-center gap-1.5 rounded-full bg-[var(--deck-accent)] px-4 py-2 text-[0.8125rem] font-semibold text-[var(--deck-on-accent)] transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <PortalIcon name="refresh" className="h-4 w-4" />
            {busy === "sync" ? "Syncing…" : "Sync now"}
          </button>
          <button
            type="button"
            onClick={handleDisconnect}
            disabled={busy !== null}
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--deck-line-strong)] px-4 py-2 text-[0.8125rem] font-medium text-[var(--deck-text-2)] transition-colors hover:border-[var(--deck-danger)] hover:text-[var(--deck-danger)] disabled:opacity-50"
          >
            {busy === "disconnect" ? "Disconnecting…" : "Disconnect"}
          </button>
        </>
      ) : (
        <a
          href="/api/pilot-health/oura/connect"
          className="inline-flex items-center gap-1.5 rounded-full bg-[var(--deck-accent)] px-4 py-2 text-[0.8125rem] font-semibold text-[var(--deck-on-accent)] transition-opacity hover:opacity-90"
        >
          <PortalIcon name="activity" className="h-4 w-4" />
          Connect Oura
        </a>
      )}
    </div>
  );
}
