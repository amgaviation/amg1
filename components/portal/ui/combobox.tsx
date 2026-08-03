"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Field } from "@/components/portal/ui/fields";

/**
 * Searchable combobox for server-action forms. Type-to-search over label +
 * keywords, keyboard navigable (arrows / Enter / Escape), ARIA combobox
 * pattern, and a hidden input so the selected VALUE posts under `name`.
 * Filtering is client-side over the options passed in; swap the options
 * source for a server search later without touching call sites.
 */

export type ComboboxOption = {
  value: string;
  label: string;
  /** Extra searchable text (e.g. email, company aliases). */
  keywords?: string;
  /** Secondary line shown under the label in the list. */
  description?: string;
};

export function Combobox({
  name,
  options,
  defaultValue = "",
  defaultLabel,
  placeholder = "Search…",
  emptyText = "No matches found.",
  required,
  disabled,
  onValueChange,
  onSearch,
  minChars = 2,
  className,
}: {
  name: string;
  options: ComboboxOption[];
  defaultValue?: string;
  /**
   * Display label for `defaultValue` when the option isn't in `options` —
   * needed with `onSearch`, where the selected value's row hasn't been
   * fetched yet on first paint.
   */
  defaultLabel?: string;
  placeholder?: string;
  emptyText?: string;
  required?: boolean;
  disabled?: boolean;
  onValueChange?: (value: string) => void;
  /**
   * Server-backed search. When provided, `options` becomes the initial
   * suggestion set and every keystroke past `minChars` queries instead of
   * filtering locally — for sources too large to ship as props.
   */
  onSearch?: (query: string) => Promise<ComboboxOption[]>;
  /** Minimum characters before `onSearch` fires. Ignored without `onSearch`. */
  minChars?: number;
  className?: string;
}) {
  const listboxId = useId();
  const [selected, setSelected] = useState<string>(defaultValue);
  const [query, setQuery] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [remote, setRemote] = useState<ComboboxOption[]>([]);
  const [loading, setLoading] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  /** Monotonic request id: a slow response must never overwrite a newer one. */
  const seq = useRef(0);
  /** Label for a preselected value whose row we haven't loaded. */
  const [fallbackLabel, setFallbackLabel] = useState(defaultLabel ?? "");

  const pool = onSearch ? (query.trim() ? remote : remote.length ? remote : options) : options;

  const selectedOption = useMemo(
    () => [...pool, ...options].find((o) => o.value === selected) ?? null,
    [pool, options, selected]
  );

  const filtered = useMemo(() => {
    // Server-backed: the source already ranked and filtered; re-filtering here
    // would drop matches on fields the label doesn't contain.
    if (onSearch) return pool;
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) =>
      `${o.label} ${o.keywords ?? ""}`.toLowerCase().includes(q)
    );
  }, [onSearch, pool, options, query]);

  useEffect(() => {
    setActive(0);
  }, [query, open]);

  // Debounced remote search with a stale-response guard, mirroring the proven
  // pattern in components/portal/crew-map/go-active-control.tsx.
  useEffect(() => {
    if (!onSearch) return;
    const term = query.trim();
    if (term && term.length < minChars) return;
    const id = ++seq.current;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const results = await onSearch(term);
        if (seq.current === id) setRemote(results);
      } catch {
        if (seq.current === id) setRemote([]);
      } finally {
        if (seq.current === id) setLoading(false);
      }
    }, 220);
    return () => window.clearTimeout(timer);
  }, [onSearch, query, minChars]);

  // Close on any pointer press outside the component.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  function choose(option: ComboboxOption) {
    setSelected(option.value);
    setFallbackLabel(option.label);
    setQuery("");
    setOpen(false);
    onValueChange?.(option.value);
  }

  function clear() {
    setSelected("");
    setFallbackLabel("");
    setQuery("");
    onValueChange?.("");
    inputRef.current?.focus();
    setOpen(true);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open) setOpen(true);
      else setActive((a) => Math.min(a + 1, filtered.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (event.key === "Enter") {
      if (open && filtered[active]) {
        event.preventDefault();
        choose(filtered[active]);
      }
    } else if (event.key === "Escape") {
      if (open) {
        event.preventDefault();
        setOpen(false);
        setQuery("");
      }
    } else if (event.key === "Tab") {
      setOpen(false);
      setQuery("");
    }
  }

  const resolvedLabel = selectedOption?.label ?? (selected ? fallbackLabel : "");
  const displayValue = open || query ? query : resolvedLabel;

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <input type="hidden" name={name} value={selected} />
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-activedescendant={open && filtered[active] ? `${listboxId}-${active}` : undefined}
          aria-autocomplete="list"
          aria-required={required || undefined}
          disabled={disabled}
          className="deck-input pr-14"
          placeholder={resolvedLabel && !open ? resolvedLabel : placeholder}
          value={displayValue}
          onChange={(event) => {
            setQuery(event.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
        />
        <div className="absolute inset-y-0 right-2 flex items-center gap-1">
          {selected && !disabled ? (
            <button
              type="button"
              tabIndex={-1}
              aria-label="Clear selection"
              onClick={clear}
              className="rounded p-2 text-[var(--deck-text-3)] transition-colors hover:text-[var(--deck-text)] sm:p-0.5"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
          <ChevronDown
            aria-hidden
            className={cn("h-4 w-4 text-[var(--deck-text-3)]", open && "rotate-180")}
          />
        </div>
      </div>

      {open && !disabled ? (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-md border border-[var(--deck-line-strong)] bg-[var(--deck-panel)] p-1 shadow-[var(--deck-shadow-card-hover)]"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-[var(--deck-text-3)]" role="presentation">
              {loading
                ? "Searching…"
                : onSearch && query.trim().length > 0 && query.trim().length < minChars
                  ? `Type ${minChars} or more characters…`
                  : emptyText}
            </li>
          ) : (
            filtered.map((option, index) => (
              <li
                key={option.value}
                id={`${listboxId}-${index}`}
                role="option"
                aria-selected={option.value === selected}
                className={cn(
                  "cursor-pointer rounded-sm px-3 py-2.5 text-sm text-[var(--deck-text)] sm:py-2",
                  index === active && "bg-[var(--deck-accent-tint)]",
                  option.value === selected && "font-semibold"
                )}
                onPointerEnter={() => setActive(index)}
                onPointerDown={(event) => {
                  event.preventDefault();
                  choose(option);
                }}
              >
                <span className="block truncate">{option.label}</span>
                {option.description ? (
                  <span className="block truncate text-xs text-[var(--deck-text-3)]">{option.description}</span>
                ) : null}
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}

export function ComboboxField({
  label,
  hint,
  required,
  ...rest
}: Parameters<typeof Combobox>[0] & { label: string; hint?: string }) {
  return (
    <Field label={label} hint={hint} required={required}>
      <Combobox required={required} {...rest} />
    </Field>
  );
}

type ClientRecord = {
  id: string;
  company_name?: string | null;
  full_name?: string | null;
  email?: string | null;
};

export function clientOptions(clients: ClientRecord[]): ComboboxOption[] {
  return clients.map((client) => ({
    value: client.id,
    label: client.company_name ?? client.full_name ?? client.email ?? client.id,
    keywords: [client.company_name, client.full_name, client.email].filter(Boolean).join(" "),
    description:
      [client.full_name && client.company_name ? client.full_name : null, client.email]
        .filter(Boolean)
        .join(" · ") || undefined,
  }));
}

/** Searchable client picker — the one component every client-linking form uses. */
export function ClientPickerField({
  clients,
  label = "Client",
  name = "client_id",
  ...rest
}: {
  clients: ClientRecord[];
  label?: string;
  name?: string;
} & Omit<Parameters<typeof ComboboxField>[0], "options" | "label" | "name">) {
  return (
    <ComboboxField
      label={label}
      name={name}
      options={clientOptions(clients)}
      placeholder="Search company, name, or email…"
      emptyText="No clients found."
      {...rest}
    />
  );
}
