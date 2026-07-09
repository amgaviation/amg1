"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  const [activeIndex, setActiveIndex] = useState(0);
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

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
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 30);
      const { overflow } = document.body.style;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = overflow;
      };
    }
    abortRef.current?.abort();
    setQuery("");
    setResults([]);
    setError(false);
  }, [open]);

  const search = useCallback((value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    // Abort any in-flight request and invalidate its id so a late resolve can't
    // clobber newer state.
    abortRef.current?.abort();
    requestIdRef.current += 1;
    setError(false);
    if (value.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const requestId = requestIdRef.current;
    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const response = await fetch(`/api/portal/search?q=${encodeURIComponent(value)}`, {
          signal: controller.signal,
        });
        if (requestId !== requestIdRef.current) return;
        if (!response.ok) {
          setResults([]);
          setError(true);
          return;
        }
        const payload = await response.json();
        if (requestId !== requestIdRef.current) return;
        setResults(payload.results ?? []);
        setActiveIndex(0);
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
        if (requestId === requestIdRef.current) {
          setResults([]);
          setError(true);
        }
      } finally {
        if (requestId === requestIdRef.current) setLoading(false);
      }
    }, 250);
  }, []);

  function onInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!results.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index - 1 + results.length) % results.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      const target = results[activeIndex];
      if (target) {
        setOpen(false);
        router.push(target.href);
      }
    }
  }

  const groups = results.reduce<Record<string, SearchResult[]>>((acc, result) => {
    (acc[result.group] ??= []).push(result);
    return acc;
  }, {});

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden items-center gap-2 rounded-lg border border-[var(--deck-line)] bg-[var(--deck-panel)] px-3 py-2 text-xs text-[var(--deck-text-3)] transition-colors hover:border-[var(--deck-accent-line)] hover:text-[var(--deck-text)] lg:flex"
        aria-label="Search (Cmd+K)"
      >
        <Search className="h-3.5 w-3.5" />
        <span>Search</span>
        <kbd className="deck-mono rounded border border-[var(--deck-line)] bg-[var(--deck-panel-2)] px-1.5 py-0.5 text-[0.6rem]">
          ⌘K
        </kbd>
      </button>

      {open ? createPortal(
        <div
          className="fixed inset-0 z-[95] flex items-start justify-center bg-[rgba(10,19,34,0.55)] p-4 pt-[12vh] backdrop-blur-sm"
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
                <Loader2 className="h-4 w-4 animate-spin text-[var(--deck-accent-ink)]" />
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
                onKeyDown={onInputKeyDown}
                placeholder="Search requests, clients, crew, invoices, quotes, leads, aircraft…"
                className="flex-1 bg-transparent text-sm text-[var(--deck-text)] outline-none placeholder:text-[var(--deck-text-3)]"
                role="combobox"
                aria-expanded={results.length > 0}
                aria-autocomplete="list"
                aria-controls="command-palette-results"
                aria-activedescendant={
                  results.length > 0 ? `command-palette-option-${activeIndex}` : undefined
                }
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

            <div
              id="command-palette-results"
              role="listbox"
              aria-label="Search results"
              className="deck-scroll max-h-[52vh] overflow-y-auto p-2"
            >
              {query.trim().length < 2 ? (
                <p className="px-3 py-6 text-center text-xs text-[var(--deck-text-3)]">
                  Type at least two characters to search every operational record.
                </p>
              ) : error ? (
                <p className="px-3 py-6 text-center text-xs text-[var(--deck-danger)]">
                  Search is unavailable right now. Please try again.
                </p>
              ) : !loading && results.length === 0 ? (
                <p className="px-3 py-6 text-center text-xs text-[var(--deck-text-3)]">
                  No matches for “{query}”.
                </p>
              ) : (
                Object.entries(groups).map(([group, items]) => (
                  <div key={group} className="mb-2">
                    <p className="deck-eyebrow px-3 pb-1 pt-2 !text-[0.58rem]">{group}</p>
                    {items.map((item) => {
                      const flatIndex = results.indexOf(item);
                      const isActive = flatIndex === activeIndex;
                      return (
                        <button
                          key={`${item.href}-${item.label}`}
                          type="button"
                          id={`command-palette-option-${flatIndex}`}
                          role="option"
                          aria-selected={isActive}
                          onClick={() => {
                            setOpen(false);
                            router.push(item.href);
                          }}
                          onMouseEnter={() => setActiveIndex(flatIndex)}
                          className={`flex w-full items-baseline justify-between gap-3 rounded-lg px-3 py-2 text-left transition-colors ${
                            isActive ? "bg-[var(--deck-accent-tint)]" : "hover:bg-[var(--deck-accent-tint)]"
                          }`}
                        >
                          <span className="min-w-0 truncate text-sm font-medium text-[var(--deck-text)]">
                            {item.label}
                          </span>
                          {item.sublabel ? (
                            <span className="shrink-0 text-xs text-[var(--deck-text-3)]">{item.sublabel}</span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>,
        document.body
      ) : null}
    </>
  );
}
