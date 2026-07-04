"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, X } from "lucide-react";

type SearchResult = {
  group: string;
  label: string;
  sublabel?: string;
  href: string;
};

/** Cmd+K global search across operational records (admin only). */
export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
    else {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  const search = useCallback((value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/portal/search?q=${encodeURIComponent(value)}`);
        const payload = await response.json();
        setResults(payload.results ?? []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);
  }, []);

  const groups = results.reduce<Record<string, SearchResult[]>>((acc, result) => {
    (acc[result.group] ??= []).push(result);
    return acc;
  }, {});

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden items-center gap-2 rounded-lg border border-[var(--deck-line)] bg-white px-3 py-2 text-xs text-[var(--deck-text-3)] transition-colors hover:border-[var(--deck-gold-line)] hover:text-[var(--deck-text)] lg:flex"
        aria-label="Search (Cmd+K)"
      >
        <Search className="h-3.5 w-3.5" />
        <span>Search</span>
        <kbd className="deck-mono rounded border border-[var(--deck-line)] bg-[#F8FAFB] px-1.5 py-0.5 text-[0.6rem]">
          ⌘K
        </kbd>
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[70] flex items-start justify-center bg-[rgba(10,19,34,0.55)] p-4 pt-[12vh] backdrop-blur-sm"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Global search"
        >
          <div
            className="deck-card w-full max-w-xl overflow-hidden"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-[var(--deck-line)] px-4 py-3">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin text-[var(--deck-gold-deep)]" />
              ) : (
                <Search className="h-4 w-4 text-[var(--deck-text-3)]" />
              )}
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  search(event.target.value);
                }}
                placeholder="Search requests, clients, crew, invoices, quotes, leads, aircraft…"
                className="flex-1 bg-transparent text-sm text-[var(--deck-text)] outline-none placeholder:text-[#98A2B3]"
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded p-1 text-[var(--deck-text-3)] hover:text-[var(--deck-text)]"
                aria-label="Close search"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="deck-scroll max-h-[52vh] overflow-y-auto p-2">
              {query.trim().length < 2 ? (
                <p className="px-3 py-6 text-center text-xs text-[var(--deck-text-3)]">
                  Type at least two characters to search every operational record.
                </p>
              ) : !loading && results.length === 0 ? (
                <p className="px-3 py-6 text-center text-xs text-[var(--deck-text-3)]">
                  No matches for “{query}”.
                </p>
              ) : (
                Object.entries(groups).map(([group, items]) => (
                  <div key={group} className="mb-2">
                    <p className="deck-eyebrow px-3 pb-1 pt-2 !text-[0.58rem]">{group}</p>
                    {items.map((item) => (
                      <button
                        key={`${item.href}-${item.label}`}
                        type="button"
                        onClick={() => {
                          setOpen(false);
                          router.push(item.href);
                        }}
                        className="flex w-full items-baseline justify-between gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-[var(--deck-gold-tint)]"
                      >
                        <span className="min-w-0 truncate text-sm font-medium text-[var(--deck-text)]">
                          {item.label}
                        </span>
                        {item.sublabel ? (
                          <span className="shrink-0 text-xs text-[var(--deck-text-3)]">{item.sublabel}</span>
                        ) : null}
                      </button>
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
