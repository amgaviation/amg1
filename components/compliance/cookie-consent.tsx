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
        <label key={category.id} className="flex items-start gap-3 rounded-lg border border-white/[0.10] bg-white/[0.045] p-3">
          <input
            type="checkbox"
            checked={choices[category.id]}
            disabled={category.required}
            onChange={(event) => {
              setChoices({ ...choices, [category.id]: event.target.checked });
            }}
            className="mt-1 h-4 w-4 accent-[var(--amg-accent-blue)]"
          />
          <span>
            <span className="block text-sm font-semibold text-white">
              {category.label}
              {category.required ? " (required)" : ""}
            </span>
            <span className="mt-1 block text-xs leading-relaxed text-[var(--amg-text-subtle)]">{category.description}</span>
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

  function acceptAllCookies() {
    const next = defaultConsentState(true);
    persistConsent(next, "accept_all");
    setChoices(next);
    setStored(readStoredConsent());
    setOpen(false);
  }

  function rejectOptionalCookies() {
    const next = defaultConsentState(false);
    persistConsent(next, "reject_optional");
    setChoices(next);
    setStored(readStoredConsent());
    setOpen(false);
  }

  if (!mounted) return null;

  return (
    <>
      {shouldShowBanner ? (
        <div
          className="fixed bottom-4 right-4 z-[80] w-[calc(100vw-2rem)] max-w-[340px] sm:bottom-5 sm:right-5"
          role="region"
          aria-label="Cookie preferences"
        >
          <div className="overflow-hidden rounded-xl border border-white/[0.12] bg-[#07111F]/97 text-white shadow-[0_16px_48px_rgba(0,0,0,0.42)] backdrop-blur-xl">
            <div className="h-px bg-[var(--amg-accent-blue)]" aria-hidden="true" />
            <div className="p-4">
              <p className="font-display text-sm font-bold uppercase tracking-wide text-white">Cookies</p>
              <p className="mt-1.5 text-xs leading-relaxed text-[var(--amg-text-secondary)]">
                AMG uses necessary tools to run the site and portal. Optional analytics and marketing run only after
                consent. See the <Link href="/cookie-policy" className="font-semibold text-[var(--amg-accent-blue)] hover:underline">Cookie Policy</Link>.
              </p>
              <div className="mt-3.5 grid gap-2">
                <button
                  type="button"
                  onClick={acceptAllCookies}
                  className="min-h-10 rounded-md border border-[var(--amg-accent-blue)] bg-[var(--amg-accent-blue)] px-4 text-sm font-bold uppercase text-white shadow-[0_8px_20px_rgba(59,130,246,0.26)] transition-colors hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--amg-accent-blue)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#07111F]"
                >
                  Accept all
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={rejectOptionalCookies}
                    className="min-h-10 rounded-md border border-white/[0.18] bg-white/[0.055] px-3 text-sm font-semibold text-white transition-colors hover:border-[var(--amg-accent-blue)] hover:bg-white/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--amg-accent-blue)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#07111F]"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="min-h-10 rounded-md border border-white/[0.18] bg-transparent px-3 text-sm font-semibold text-[var(--amg-text-secondary)] transition-colors hover:border-[var(--amg-accent-blue)] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--amg-accent-blue)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#07111F]"
                  >
                    Manage
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {open ? (
        <div className="fixed inset-0 z-[90] flex items-end bg-slate-950/72 p-4 backdrop-blur-sm sm:items-center sm:justify-center" role="dialog" aria-modal="true" aria-labelledby="cookie-preferences-title">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-lg border border-white/[0.12] bg-[#07111F] p-5 text-white shadow-[0_24px_90px_rgba(0,0,0,0.42)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="cookie-preferences-title" className="font-display text-2xl font-bold uppercase text-white">
                  {preferencesTitle}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-[var(--amg-text-secondary)]">
                  Choose which optional categories AMG may use on this browser.
                </p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="min-h-11 rounded-full border border-white/[0.18] px-4 text-sm font-semibold text-white hover:border-[var(--amg-accent-blue)]">
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
                className="min-h-11 rounded-full border border-white/[0.18] px-4 text-sm font-semibold text-[var(--amg-text-secondary)] hover:border-[var(--amg-accent-blue)] hover:text-white"
              >
                Disable Optional
              </button>
              <button
                type="button"
                onClick={acceptAllCookies}
                className="min-h-11 rounded-full border border-[var(--amg-accent-blue)] px-4 text-sm font-semibold text-[var(--amg-accent-blue)] hover:bg-primary/10"
              >
                Accept all
              </button>
              <button
                type="button"
                onClick={() => {
                  persistConsent(choices, "preferences");
                  setStored(readStoredConsent());
                  setOpen(false);
                }}
                className="min-h-11 rounded-full border border-[var(--amg-accent-blue)] bg-[var(--amg-accent-blue)] px-4 text-sm font-semibold text-white hover:bg-blue-500"
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
