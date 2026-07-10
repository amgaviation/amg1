"use client";

import { useMemo, useRef, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Recipient picker for the email composer: one searchable input over every
 * portal audience (grouped), selections shown as removable chips, and
 * free-typed addresses accepted for off-portal recipients. Each selection
 * posts as its own hidden `name` input, so the existing server action's
 * formData.getAll("to") contract is unchanged.
 */

export type RecipientGroup = {
  label: string;
  options: { email: string; label: string; description?: string }[];
};

type Chip = { email: string; label: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function RecipientPicker({
  name = "to",
  groups,
  placeholder = "Search clients, crew, partners — or type any email…",
}: {
  name?: string;
  groups: RecipientGroup[];
  placeholder?: string;
}) {
  const [chips, setChips] = useState<Chip[]>([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const selectedEmails = useMemo(
    () => new Set(chips.map((chip) => chip.email.toLowerCase())),
    [chips]
  );

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return groups
      .map((group) => ({
        label: group.label,
        options: group.options.filter((option) => {
          if (selectedEmails.has(option.email.toLowerCase())) return false;
          if (!q) return true;
          return `${option.label} ${option.email} ${option.description ?? ""}`
            .toLowerCase()
            .includes(q);
        }),
      }))
      .filter((group) => group.options.length > 0);
  }, [groups, query, selectedEmails]);

  const flat = useMemo(
    () => filteredGroups.flatMap((group) => group.options),
    [filteredGroups]
  );

  const typedEmails = query
    .split(/[,;\s]+/)
    .map((piece) => piece.trim())
    .filter((piece) => EMAIL_RE.test(piece) && !selectedEmails.has(piece.toLowerCase()));

  function add(chip: Chip) {
    if (selectedEmails.has(chip.email.toLowerCase())) return;
    setChips((current) => [...current, chip]);
    setQuery("");
    setActive(0);
    inputRef.current?.focus();
  }

  function remove(email: string) {
    setChips((current) => current.filter((chip) => chip.email !== email));
    inputRef.current?.focus();
  }

  function addTyped() {
    if (!typedEmails.length) return false;
    setChips((current) => [
      ...current,
      ...typedEmails.map((email) => ({ email, label: email })),
    ]);
    setQuery("");
    setActive(0);
    return true;
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      if (open) {
        // Only swallow Escape while the dropdown is open — a second press
        // reaches the surrounding modal and closes it, as expected.
        event.stopPropagation();
        setOpen(false);
      }
      return;
    }
    if (event.key === "Backspace" && !query && chips.length) {
      remove(chips[chips.length - 1].email);
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActive((index) => Math.min(index + 1, flat.length - 1));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
      return;
    }
    if (event.key === "Enter" || event.key === ",") {
      // Never submit the form from this input — Enter picks a recipient.
      event.preventDefault();
      if (open && flat[active]) {
        add({ email: flat[active].email, label: flat[active].label });
        return;
      }
      addTyped();
    }
  }

  let optionIndex = -1;

  return (
    <div ref={rootRef} className="grid gap-2">
      {chips.length ? (
        <div className="flex flex-wrap gap-1.5">
          {chips.map((chip) => (
            <span
              key={chip.email}
              className="inline-flex max-w-full items-center gap-1.5 rounded-[0.25rem] border border-[var(--deck-accent-line)] bg-[var(--deck-accent-tint)] py-1 pl-2.5 pr-1 text-xs font-medium text-[var(--deck-accent-ink)]"
            >
              <span className="truncate">{chip.label}</span>
              {chip.label !== chip.email ? (
                <span className="hidden truncate text-[var(--deck-text-3)] sm:inline">
                  {chip.email}
                </span>
              ) : null}
              <button
                type="button"
                onClick={() => remove(chip.email)}
                aria-label={`Remove ${chip.label}`}
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm text-[var(--deck-text-3)] transition-colors hover:bg-[var(--deck-panel)] hover:text-[var(--deck-danger)]"
              >
                <X className="h-3 w-3" aria-hidden />
              </button>
              <input type="hidden" name={name} value={chip.email} />
            </span>
          ))}
        </div>
      ) : null}

      <div className="relative">
        <div className="flex items-center rounded-md border border-[var(--deck-line)] bg-[var(--deck-panel)] focus-within:border-[var(--deck-accent-line)]">
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={open}
            aria-controls="recipient-picker-listbox"
            aria-label="Add recipients"
            value={query}
            placeholder={chips.length ? "Add another recipient…" : placeholder}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
              setActive(0);
            }}
            onFocus={() => setOpen(true)}
            onBlur={(event) => {
              // Let option mousedown run before the panel unmounts.
              if (!rootRef.current?.contains(event.relatedTarget as Node)) {
                setOpen(false);
                addTyped();
              }
            }}
            onKeyDown={onKeyDown}
            className="min-h-11 w-full bg-transparent px-3 text-sm font-normal normal-case text-[var(--deck-text)] outline-none placeholder:text-[var(--deck-text-3)]"
          />
          <ChevronDown
            className={cn(
              "mr-3 h-4 w-4 shrink-0 text-[var(--deck-text-3)]",
              open && "rotate-180"
            )}
            aria-hidden
          />
        </div>

        {open && (flat.length > 0 || typedEmails.length > 0) ? (
          <div
            id="recipient-picker-listbox"
            role="listbox"
            className="absolute inset-x-0 top-full z-30 mt-1 max-h-64 overflow-y-auto rounded-md border border-[var(--deck-line-strong)] bg-[var(--deck-panel)] py-1 shadow-[var(--deck-shadow-pop)]"
          >
            {typedEmails.length ? (
              <button
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault();
                  addTyped();
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[var(--deck-accent-ink)] hover:bg-[var(--deck-accent-tint)]"
              >
                Add {typedEmails.join(", ")}
              </button>
            ) : null}
            {filteredGroups.map((group) => (
              <div key={group.label}>
                <p className="deck-eyebrow px-3 pb-1 pt-2 !text-[0.58rem]">{group.label}</p>
                {group.options.map((option) => {
                  optionIndex += 1;
                  const index = optionIndex;
                  return (
                    <button
                      key={option.email}
                      type="button"
                      role="option"
                      aria-selected={index === active}
                      onMouseDown={(event) => {
                        event.preventDefault();
                        add({ email: option.email, label: option.label });
                      }}
                      onMouseEnter={() => setActive(index)}
                      className={cn(
                        "flex w-full flex-col items-start px-3 py-2 text-left",
                        index === active && "bg-[var(--deck-accent-tint)]"
                      )}
                    >
                      <span className="text-sm text-[var(--deck-text)]">{option.label}</span>
                      <span className="text-xs text-[var(--deck-text-3)]">
                        {option.email}
                        {option.description ? ` · ${option.description}` : ""}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <p className="text-xs font-normal normal-case leading-5 text-[var(--deck-text-3)]">
        Type to search every portal user, or enter any email address and press
        Enter to add it.
      </p>
    </div>
  );
}
