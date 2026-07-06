"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** Operations Deck form fields. All inputs share the .deck-input surface. */

export function Field({
  label,
  hint,
  required,
  children,
  className,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("grid gap-1.5", className)}>
      <span className="deck-eyebrow !text-[0.6rem] !text-[var(--deck-text-2)]">
        {label}
        {required ? <span className="ml-1 text-[var(--deck-accent-ink)]">*</span> : null}
      </span>
      {children}
      {hint ? (
        <span className="text-[0.7rem] leading-5 text-[var(--deck-text-3)]">{hint}</span>
      ) : null}
    </label>
  );
}

export function TextField(
  props: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }
) {
  const { label, hint, className, required, ...rest } = props;
  return (
    <Field label={label} hint={hint} required={required}>
      <input {...rest} required={required} className={cn("deck-input", className)} />
    </Field>
  );
}

export function TextAreaField(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; hint?: string }
) {
  const { label, hint, className, required, ...rest } = props;
  return (
    <Field label={label} hint={hint} required={required}>
      <textarea {...rest} required={required} className={cn("deck-input", className)} />
    </Field>
  );
}

/**
 * Custom styled dropdown (Radix Select) replacing the OS-native menu.
 * Form-post compatible: with `name` set, Radix renders a hidden native
 * select carrying the value. Options with value "" become the placeholder
 * (Radix forbids empty item values); an unset select posts "".
 */
export function DeckSelect(
  props: React.SelectHTMLAttributes<HTMLSelectElement> & {
    options: { value: string; label: string }[];
    placeholder?: string;
  }
) {
  const { options, placeholder, className, name, value, defaultValue, onChange, disabled, required, id, "aria-label": ariaLabel } = props;
  const items = options.filter((o) => o.value !== "");
  const emptyOption = options.find((o) => o.value === "");
  const resolvedPlaceholder = placeholder ?? emptyOption?.label ?? "Select…";
  const controlled = value !== undefined;

  return (
    <Select
      name={name}
      disabled={disabled}
      {...(controlled
        ? { value: String(value) === "" ? undefined : String(value) }
        : {
            defaultValue:
              defaultValue === undefined || String(defaultValue) === ""
                ? undefined
                : String(defaultValue),
          })}
      onValueChange={(next) => {
        onChange?.({ target: { value: next, name: name ?? "" } } as unknown as React.ChangeEvent<HTMLSelectElement>);
      }}
    >
      <SelectTrigger
        id={id}
        aria-label={ariaLabel}
        aria-required={required || undefined}
        className={cn(
          "deck-input h-auto w-full justify-between shadow-none data-[placeholder]:text-[var(--deck-text-3)] [&_svg]:text-[var(--deck-text-3)]",
          className
        )}
      >
        <SelectValue placeholder={resolvedPlaceholder} />
      </SelectTrigger>
      <SelectContent
        position="popper"
        align="start"
        className="max-h-72 border-[var(--deck-line-strong)] bg-[var(--deck-panel)] text-[var(--deck-text)] shadow-[var(--deck-shadow-card-hover)]"
      >
        {items.map((o) => (
          <SelectItem
            key={o.value}
            value={o.value}
            className="py-2.5 focus:bg-[var(--deck-accent-tint)] focus:text-[var(--deck-text)] data-[state=checked]:font-semibold sm:py-1.5"
          >
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function SelectField(
  props: React.SelectHTMLAttributes<HTMLSelectElement> & {
    label: string;
    hint?: string;
    options: { value: string; label: string }[];
    placeholder?: string;
  }
) {
  const { label, hint, required, ...rest } = props;
  return (
    <Field label={label} hint={hint} required={required}>
      <DeckSelect {...rest} required={required} />
    </Field>
  );
}

/** ICAO/IATA-preferred airport input. Uppercases and validates format. */
export function AirportField({
  label,
  name,
  required,
  defaultValue,
  hint = "ICAO preferred (e.g. KTEB, KPBI)",
}: {
  label: string;
  name: string;
  required?: boolean;
  defaultValue?: string;
  hint?: string;
}) {
  const [value, setValue] = useState(defaultValue ?? "");
  return (
    <Field label={label} hint={hint} required={required}>
      <input
        name={name}
        required={required}
        value={value}
        onChange={(e) => setValue(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
        maxLength={4}
        pattern="[A-Za-z0-9]{3,4}"
        placeholder="KTEB"
        className="deck-input deck-mono max-md:!text-base md:!text-sm uppercase [letter-spacing:0.24em]"
      />
    </Field>
  );
}

export function CheckboxField({
  label,
  name,
  defaultChecked,
}: {
  label: string;
  name: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-[var(--deck-line-strong)] bg-[var(--deck-panel)] px-3 py-2.5 text-sm transition-colors hover:border-[var(--deck-accent-line)]">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        value="true"
        className="h-4 w-4 accent-[var(--deck-accent)]"
      />
      <span className="text-[var(--deck-text)]">{label}</span>
    </label>
  );
}

export function FileField({
  label,
  name,
  accept,
  required,
  hint = "PDF, JPG or PNG, up to 50 MB",
}: {
  label: string;
  name: string;
  accept?: string;
  required?: boolean;
  hint?: string;
}) {
  const [fileName, setFileName] = useState<string>("");
  return (
    <Field label={label} hint={hint} required={required}>
      <div className="flex items-center gap-3">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--deck-line-strong)] bg-[var(--deck-panel)] px-3 py-2.5 text-sm font-medium text-[var(--deck-text)] transition-colors hover:border-[var(--deck-accent)] sm:py-2">
          Choose file
          <input
            type="file"
            name={name}
            accept={accept}
            required={required}
            className="hidden"
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
          />
        </label>
        <span className="truncate text-xs text-[var(--deck-text-3)]">
          {fileName || "No file selected"}
        </span>
      </div>
    </Field>
  );
}

export const PortalFormField = Field;
export const PortalSearchInput = TextField;
export const PortalTextarea = TextAreaField;
export const PortalSelect = SelectField;
export const PortalDateField = TextField;
