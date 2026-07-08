"use client";

import { useMemo, useRef, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * People picker for calendar events: one searchable input over every portal
 * audience (grouped by role), selections shown as removable chips. Each
 * selection posts as its own hidden `attendee_ids` input, so the server
 * action reads them with formData.getAll("attendee_ids").
 */

export type AttendeeGroup = {
  label: string;
  options: { id: string; label: string; description?: string }[];
};

type Chip = { id: string; label: string };

export function AttendeePicker({
  name = "attendee_ids",
  groups,
  initial = [],
  placeholder = "Search clients, crew, partners, staff…",
}: {
  name?: string;
  groups: AttendeeGroup[];
  /** Pre-selected attendees (edit mode). */
  initial?: Chip[];
  placeholder?: string;
}) {
  const [chips, setChips] = useState<Chip[]>(initial);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const selectedIds = useMemo(() => new Set(chips.map((chip) => chip.id)), [chips]);

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return groups
      .map((group) => ({
        label: group.label,
        options: group.options.filter((option) => {
          if (selectedIds.has(option.id)) return false;
          if (!q) return true;
          return `${option.label} ${option.description ?? ""}`.toLowerCase().includes(q);
        }),
      }))
      .filter((group) => group.options.length > 0);
  }, [groups, query, selectedIds]);

  const flat = useMemo(() => filteredGroups.flatMap((group) => group.options), [filteredGroups]);

  function add(chip: Chip) {
    if (selectedIds.has(chip.id)) return;
    setChips((current) => [...current, chip]);
    setQuery("");
    setActive(0);
    inputRef.current?.focus();
  }

  function remove(id: string) {
    setChips((current) => current.filter((chip) => chip.id !== id));
    inputRef.current?.focus();
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      if (open) {
        event.stopPropagation();
        setOpen(false);
      }
      return;
    }
    if (event.key === "Backspace" && !query && chips.length) {
      remove(chips[chips.length - 1].id);
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
    if (event.key === "Enter") {
      event.preventDefault();
      if (open && flat[active]) add({ id: flat[active].id, label: flat[active].label });
    }
  }

  let optionIndex = -1;

  return (
    <div ref={rootRef} className="grid gap-2">
      {chips.length ? (
        <div className="flex flex-wrap gap-1.5">
          {chips.map((chip) => (
            <span
              key={chip.id}
              className="inline-flex max-w-full items-center gap-1.5 rounded-[0.25rem] border border-[var(--deck-accent-line)] bg-[var(--deck-accent-tint)] py-1 pl-2.5 pr-1 text-xs font-medium text-[var(--deck-accent-ink)]"
            >
              <span className="truncate">{chip.label}</span>
              <button
                type="button"
                onClick={() => remove(chip.id)}
                aria-label={`Remove ${chip.label}`}
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm text-[var(--deck-text-3)] transition-colors hover:bg-[var(--deck-panel)] hover:text-[var(--deck-danger)]"
              >
                <X className="h-3 w-3" aria-hidden />
              </button>
              <input type="hidden" name={name} value={chip.id} />
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
            aria-controls="attendee-picker-listbox"
            aria-label="Add people"
            value={query}
            placeholder={chips.length ? "Add another person…" : placeholder}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
              setActive(0);
            }}
            onFocus={() => setOpen(true)}
            onBlur={(event) => {
              if (!rootRef.current?.contains(event.relatedTarget as Node)) setOpen(false);
            }}
            onKeyDown={onKeyDown}
            className="min-h-11 w-full bg-transparent px-3 text-sm font-normal normal-case text-[var(--deck-text)] outline-none placeholder:text-[var(--deck-text-3)]"
          />
          <ChevronDown
            className={cn(
              "mr-3 h-4 w-4 shrink-0 text-[var(--deck-text-3)] transition-transform",
              open && "rotate-180"
            )}
            aria-hidden
          />
        </div>

        {open && flat.length > 0 ? (
          <div
            id="attendee-picker-listbox"
            role="listbox"
            className="absolute inset-x-0 top-full z-30 mt-1 max-h-64 overflow-y-auto rounded-md border border-[var(--deck-line-strong)] bg-[var(--deck-panel)] py-1 shadow-[0_16px_40px_-18px_rgba(7,11,20,0.5)]"
          >
            {filteredGroups.map((group) => (
              <div key={group.label}>
                <p className="deck-eyebrow px-3 pb-1 pt-2 !text-[0.58rem]">{group.label}</p>
                {group.options.map((option) => {
                  optionIndex += 1;
                  const index = optionIndex;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      role="option"
                      aria-selected={index === active}
                      onMouseDown={(event) => {
                        event.preventDefault();
                        add({ id: option.id, label: option.label });
                      }}
                      onMouseEnter={() => setActive(index)}
                      className={cn(
                        "flex w-full flex-col items-start px-3 py-2 text-left",
                        index === active && "bg-[var(--deck-accent-tint)]"
                      )}
                    >
                      <span className="text-sm text-[var(--deck-text)]">{option.label}</span>
                      {option.description ? (
                        <span className="text-xs text-[var(--deck-text-3)]">{option.description}</span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <p className="text-xs font-normal normal-case leading-5 text-[var(--deck-text-3)]">
        Linked people are notified they were added, unless you check &ldquo;Do not notify&rdquo; below.
      </p>
    </div>
  );
}
