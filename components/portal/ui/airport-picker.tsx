"use client";

import { useCallback } from "react";
import { Combobox, type ComboboxOption } from "@/components/portal/ui/combobox";
import { Field } from "@/components/portal/ui/fields";
import { searchAirportOptions } from "@/app/portal/actions/airports";

/**
 * Airport picker backed by the synced `airports` table.
 *
 * Replaces the free-text AirportField, whose `pattern` validation was
 * browser-side only — the server accepted any non-empty string, so a typo
 * became a mission's departure airport unchallenged. Selecting from this list
 * posts a code that is known to exist; the server action still re-checks,
 * because a user can always paste.
 */

function toOption(row: {
  code: string;
  name: string;
  city: string | null;
  state: string | null;
}): ComboboxOption {
  const place = [row.city, row.state].filter(Boolean).join(", ");
  return {
    value: row.code,
    label: `${row.code} — ${row.name}`,
    description: place || undefined,
    keywords: `${row.name} ${place}`,
  };
}

export function AirportPicker({
  name,
  defaultValue,
  defaultLabel,
  required,
  placeholder = "Search code, name, or city…",
}: {
  name: string;
  defaultValue?: string;
  defaultLabel?: string;
  required?: boolean;
  placeholder?: string;
}) {
  const search = useCallback(async (query: string) => {
    const rows = await searchAirportOptions(query);
    return rows.map(toOption);
  }, []);

  return (
    <Combobox
      name={name}
      options={[]}
      defaultValue={defaultValue}
      defaultLabel={defaultLabel ?? defaultValue}
      required={required}
      placeholder={placeholder}
      emptyText="No matching airport."
      onSearch={search}
    />
  );
}

export function AirportPickerField({
  label,
  name,
  hint = "Search by ICAO code, airport name, or city.",
  required,
  defaultValue,
  defaultLabel,
}: {
  label: string;
  name: string;
  hint?: string;
  required?: boolean;
  defaultValue?: string;
  defaultLabel?: string;
}) {
  return (
    <Field label={label} hint={hint} required={required}>
      <AirportPicker
        name={name}
        defaultValue={defaultValue}
        defaultLabel={defaultLabel}
        required={required}
      />
    </Field>
  );
}
