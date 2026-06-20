"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CONSENT_STORAGE_KEY,
  CONSENT_VERSION,
  consentCategories,
  defaultConsentState,
  type ConsentCategoryId,
  type ConsentState,
} from "@/lib/compliance/consent";

type StoredConsent = {
  version: string;
  choices: ConsentState;
  updatedAt: string;
  source: string;
};

function readStoredConsent(): StoredConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredConsent;
    if (parsed.version !== CONSENT_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

function persistConsent(choices: ConsentState, source: string) {
  const record: StoredConsent = {
    version: CONSENT_VERSION,
    choices,
    updatedAt: new Date().toISOString(),
    source,
  };
  window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(record));
  window.dispatchEvent(new CustomEvent("amg:cookie-consent-updated", { detail: record }));
  void fetch("/api/compliance/consent", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(record),
    keepalive: true,
  }).catch(() => {});
}

function CookiePreferencesForm({
  choices,
  setChoices,
}: {
  choices: ConsentState;
  setChoices: (next: ConsentState) => void;
}) {
  return (
    <div className="grid gap-3">
      {consentCategories.map((category) => (
        <label key={category.id} className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3">
          <input
            type="checkbox"
            checked={choices[category.id]}
            disabled={category.required}
            onChange={(event) => {
              setChoices({ ...choices, [category.id]: event.target.checked });
            }}
            className="mt-1 h-4 w-4 accent-[var(--oc-blue)]"
          />
          <span>
            <span className="block text-sm font-semibold text-slate-950">
              {category.label}
              {category.required ? " (required)" : ""}
            </span>
            <span className="mt-1 block text-xs leading-relaxed text-slate-600">{category.description}</span>
          </span>
        </label>
      ))}
    </div>
  );
}

export function CookieConsentBanner() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [stored, setStored] = useState<StoredConsent | null>(null);
  const [choices, setChoices] = useState<ConsentState>(defaultConsentState(false));

  useEffect(() => {
    const existing = readStoredConsent();
    const gpcEnabled = Boolean((navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl);
    setStored(existing);
    setChoices(existing?.choices ?? defaultConsentState(!gpcEnabled && false));
    setMounted(true);
  }, []);

  useEffect(() => {
    function onOpenPreferences() {
      setOpen(true);
      const existing = readStoredConsent();
      if (existing) setChoices(existing.choices);
    }

    window.addEventListener("amg:open-cookie-preferences", onOpenPreferences);
    return () => window.removeEventListener("amg:open-cookie-preferences", onOpenPreferences);
  }, []);

  const shouldShowBanner = mounted && !stored;
  const preferencesTitle = useMemo(
    () => (stored ? "Cookie preferences" : "Manage cookie preferences"),
    [stored],
  );

  if (!mounted) return null;

  return (
    <>
      {shouldShowBanner ? (
        <div className="fixed inset-x-0 bottom-0 z-[80] border-t border-slate-200 bg-white/95 px-4 py-4 shadow-[0_-20px_50px_rgba(8,20,36,0.16)] backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <p className="font-display text-sm font-bold uppercase text-slate-950">Cookie preferences</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                AMG uses necessary tools for site and portal operation. Optional analytics, marketing, session recording,
                and embedded tools run only after consent. Review the <Link href="/cookie-policy" className="text-accent hover:underline">Cookie Policy</Link>.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  const next = defaultConsentState(false);
                  persistConsent(next, "reject_optional");
                  setStored(readStoredConsent());
                }}
                className="min-h-11 rounded-full border border-slate-300 px-4 text-sm font-semibold text-slate-800 hover:border-accent"
              >
                Reject Optional
              </button>
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="min-h-11 rounded-full border border-slate-300 px-4 text-sm font-semibold text-slate-800 hover:border-accent"
              >
                Manage
              </button>
              <button
                type="button"
                onClick={() => {
                  const next = defaultConsentState(true);
                  persistConsent(next, "accept_all");
                  setStored(readStoredConsent());
                }}
                className="min-h-11 rounded-full bg-[var(--oc-blue)] px-4 text-sm font-semibold text-white hover:bg-[var(--oc-navy)]"
              >
                Accept All
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {open ? (
        <div className="fixed inset-0 z-[90] flex items-end bg-slate-950/40 p-4 sm:items-center sm:justify-center" role="dialog" aria-modal="true" aria-labelledby="cookie-preferences-title">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-lg bg-white p-5 shadow-[0_24px_90px_rgba(8,20,36,0.28)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="cookie-preferences-title" className="font-display text-2xl font-bold uppercase text-slate-950">
                  {preferencesTitle}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  Choose which optional categories AMG may use on this browser.
                </p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="min-h-11 rounded-full border border-slate-300 px-4 text-sm font-semibold text-slate-800">
                Close
              </button>
            </div>
            <div className="mt-5">
              <CookiePreferencesForm choices={choices} setChoices={setChoices} />
            </div>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setChoices(defaultConsentState(false))}
                className="min-h-11 rounded-full border border-slate-300 px-4 text-sm font-semibold text-slate-800 hover:border-accent"
              >
                Disable Optional
              </button>
              <button
                type="button"
                onClick={() => {
                  persistConsent(choices, "preferences");
                  setStored(readStoredConsent());
                  setOpen(false);
                }}
                className="min-h-11 rounded-full bg-[var(--oc-blue)] px-4 text-sm font-semibold text-white hover:bg-[var(--oc-navy)]"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function CookiePreferencesButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => window.dispatchEvent(new Event("amg:open-cookie-preferences"))}
    >
      Cookie Preferences
    </button>
  );
}

export function useConsentChoices() {
  const [choices, setChoices] = useState<ConsentState>(defaultConsentState(false));

  useEffect(() => {
    function sync() {
      setChoices(readStoredConsent()?.choices ?? defaultConsentState(false));
    }

    sync();
    window.addEventListener("amg:cookie-consent-updated", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("amg:cookie-consent-updated", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return choices;
}

export type { ConsentCategoryId, ConsentState };
