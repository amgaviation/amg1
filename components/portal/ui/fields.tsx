"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const baseInput =
  "h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition-colors placeholder:text-slate-400 focus:border-primary focus:shadow-[0_0_0_3px_rgba(59,130,246,0.14)]";

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
    <label className={cn("grid gap-2", className)}>
      <span className="eyebrow text-[0.6rem] text-slate-500">
        {label}
        {required ? <span className="ml-1 text-primary">*</span> : null}
      </span>
      {children}
      {hint ? <span className="text-[0.7rem] text-slate-500">{hint}</span> : null}
    </label>
  );
}

export function TextField(
  props: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }
) {
  const { label, hint, className, required, ...rest } = props;
  return (
    <Field label={label} hint={hint} required={required}>
      <input {...rest} required={required} className={cn(baseInput, className)} />
    </Field>
  );
}

export function TextAreaField(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; hint?: string }
) {
  const { label, hint, className, required, ...rest } = props;
  return (
    <Field label={label} hint={hint} required={required}>
      <textarea
          {...rest}
          required={required}
          className={cn(
          "min-h-24 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition-colors placeholder:text-slate-400 focus:border-primary focus:shadow-[0_0_0_3px_rgba(59,130,246,0.14)]",
          className
        )}
      />
    </Field>
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
  const { label, hint, className, required, options, placeholder, ...rest } = props;
  return (
    <Field label={label} hint={hint} required={required}>
      <select {...rest} required={required} className={cn(baseInput, className)}>
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
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
        className={cn(baseInput, "font-mono uppercase tracking-widest")}
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
    <label className="flex items-center gap-3 rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        value="true"
        className="h-4 w-4 accent-[var(--primary)]"
      />
      <span className="text-slate-800">{label}</span>
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
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm hover:border-primary">
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
        <span className="truncate text-xs text-slate-500">
          {fileName || "No file selected"}
        </span>
      </div>
    </Field>
  );
}
