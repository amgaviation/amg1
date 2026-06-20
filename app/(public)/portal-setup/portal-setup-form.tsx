"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { ArrowRight } from "lucide-react";

function message(code: string | null) {
  if (code === "mismatch") return "The entries do not match.";
  if (code === "weak") return "Use at least 8 characters.";
  if (code === "invalid") return "Open the latest setup link from your AMG email.";
  return "The setup link could not be verified. Request a new link from AMG.";
}

export function PortalSetupForm() {
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    return url && key ? createBrowserClient(url, key) : null;
  }, []);

  useEffect(() => {
    async function bootstrap() {
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const query = new URLSearchParams(window.location.search);
      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");
      const code = query.get("code");

      try {
        if (!supabase) {
          setErr("failed");
          return;
        }

        await supabase.auth.signOut({ scope: "local" });

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
          if (error) throw error;
          window.history.replaceState(null, "", "/portal-setup");
        } else if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          window.history.replaceState(null, "", "/portal-setup");
        } else {
          setErr("invalid");
          return;
        }

        const { data, error } = await supabase.auth.getUser();
        if (error || !data.user) throw error || new Error("No setup user");
        setEmail(data.user.email ?? null);
        setReady(true);
      } catch (error) {
        console.error("Portal setup failed", error);
        setErr("failed");
      }
    }

    bootstrap();
  }, [supabase]);

  async function submit(formData: FormData) {
    setBusy(true);
    setErr(null);
    if (!supabase) {
      setErr("failed");
      setBusy(false);
      return;
    }

    const first = String(formData.get("secret_one") ?? "");
    const second = String(formData.get("secret_two") ?? "");

    if (first.length < 8) {
      setErr("weak");
      setBusy(false);
      return;
    }
    if (first !== second) {
      setErr("mismatch");
      setBusy(false);
      return;
    }

    const payload = { ["password"]: first } as { password: string };
    const { error } = await supabase.auth.updateUser(payload);
    if (error) {
      setErr("failed");
      setBusy(false);
      return;
    }

    const done = await fetch("/api/portal-setup/complete", { method: "POST", credentials: "include" });
    if (!done.ok) {
      setErr("failed");
      setBusy(false);
      return;
    }

    await supabase.auth.signOut();
    window.location.href = "/login?success=password-reset";
  }

  return (
    <form action={submit} className="mt-6 grid gap-4">
      {email ? <p className="rounded-lg border border-white/[0.10] bg-background/60 px-4 py-3 text-sm text-muted-foreground">Setting up access for <span className="text-foreground">{email}</span></p> : null}
      {err ? <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-red-200">{message(err)}</div> : null}
      {!ready && !err ? <p className="text-sm text-muted-foreground">Verifying setup link...</p> : null}
      <label className="grid gap-2 text-sm text-muted-foreground">
        New portal login key
        <input name="secret_one" type="password" required minLength={8} autoComplete="new-password" disabled={!ready || busy} className="support-field h-12 px-4 text-base disabled:opacity-60" />
      </label>
      <label className="grid gap-2 text-sm text-muted-foreground">
        Confirm portal login key
        <input name="secret_two" type="password" required minLength={8} autoComplete="new-password" disabled={!ready || busy} className="support-field h-12 px-4 text-base disabled:opacity-60" />
      </label>
      <button type="submit" disabled={!ready || busy} className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-accent px-5 font-display text-xs font-semibold uppercase tracking-widest text-accent-foreground transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60">
        {busy ? "Saving..." : "Finish Setup"}
        <ArrowRight className="h-4 w-4" />
      </button>
    </form>
  );
}
