import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { DetailRow, EmptyState, SectionCard } from "@/components/portal/ui/primitives";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import type { Tone } from "@/lib/portal/constants";
import { cn } from "@/lib/utils";
import { DeckSelect } from "@/components/portal/ui/fields";
import { Combobox } from "@/components/portal/ui/combobox";

export type DetailValue = string | number | boolean | null | undefined;

export type DetailItem = {
  label: string;
  value: DetailValue;
  href?: string | null;
};

export type DetailFormField = {
  name: string;
  label: string;
  type?: "text" | "email" | "tel" | "number" | "date" | "textarea" | "select";
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  fullWidth?: boolean;
};

const inputClassName = "deck-input";

export function detailValue(value: DetailValue) {
  if (value === undefined || value === null || value === "") return "Not provided";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

function formValue(value: DetailValue) {
  if (value === undefined || value === null) return "";
  return String(value);
}

function FieldInput({ field, values }: { field: DetailFormField; values: Record<string, DetailValue> }) {
  const value = formValue(values[field.name]);

  if (field.type === "textarea") {
    return (
      <textarea
        id={field.name}
        name={field.name}
        required={field.required}
        defaultValue={value}
        placeholder={field.placeholder}
        className={cn(inputClassName, "min-h-28 py-2")}
      />
    );
  }

  if (field.type === "select") {
    if ((field.options?.length ?? 0) > 12) {
      return (
        <Combobox
          name={field.name}
          required={field.required}
          defaultValue={value}
          options={(field.options ?? []).filter((o) => o.value !== "")}
          placeholder={field.options?.find((o) => o.value === "")?.label ?? "Search…"}
        />
      );
    }
    return (
      <DeckSelect
        id={field.name}
        name={field.name}
        required={field.required}
        defaultValue={value}
        options={field.options ?? []}
      />
    );
  }

  return (
    <input
      id={field.name}
      name={field.name}
      type={field.type ?? "text"}
      required={field.required}
      defaultValue={value}
      placeholder={field.placeholder}
      className={inputClassName}
    />
  );
}

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Button asChild variant="outline" className="gap-2">
      <Link href={href}>
        <ArrowLeft className="h-4 w-4" />
        {label}
      </Link>
    </Button>
  );
}

export function RecordSummaryHeader({
  eyebrow,
  title,
  subtitle,
  status,
  secondaryStatus,
  meta,
  actions,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string | null;
  status?: { label: string; tone?: Tone };
  secondaryStatus?: { label: string; tone?: Tone };
  meta?: string | null;
  actions?: React.ReactNode;
}) {
  return (
    <section className="deck-card deck-gold-rail p-5 pl-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="deck-eyebrow">{eyebrow}</p>
          <h2 className="deck-title mt-2 break-words text-2xl sm:text-3xl">
            {title}
          </h2>
          {subtitle ? <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--deck-text-2)]">{subtitle}</p> : null}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {status ? <StatusBadge label={status.label} tone={status.tone} /> : null}
            {secondaryStatus ? <StatusBadge label={secondaryStatus.label} tone={secondaryStatus.tone} /> : null}
            {meta ? <span className="deck-mono text-[var(--deck-text-3)]">{meta}</span> : null}
          </div>
        </div>
        {actions ? <div data-portal-action-bar className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </section>
  );
}

export function DetailGrid({ items }: { items: DetailItem[] }) {
  return (
    <dl>
      {items.map((item) => (
        <DetailRow key={item.label} label={item.label}>
          {item.href ? (
            <Link href={item.href} className="inline-flex items-center gap-1 font-semibold text-[var(--deck-accent-ink)] hover:underline">
              {detailValue(item.value)}
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          ) : (
            detailValue(item.value)
          )}
        </DetailRow>
      ))}
    </dl>
  );
}

export function RelatedList({
  items,
  emptyTitle,
  emptyDescription,
}: {
  items: { title: string; href?: string | null; meta?: string | null; body?: string | null; status?: React.ReactNode }[];
  emptyTitle: string;
  emptyDescription?: string;
}) {
  if (!items.length) {
    return <EmptyState icon="clipboard" title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="grid gap-3">
      {items.map((item) => {
        const content = (
          <div className="deck-inset deck-card-hover p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-[var(--deck-text)]">{item.title}</p>
                {item.meta ? <p className="deck-mono mt-1 text-[var(--deck-text-3)]">{item.meta}</p> : null}
              </div>
              {item.status}
            </div>
            {item.body ? <p className="mt-3 text-sm leading-6 text-[var(--deck-text-2)]">{item.body}</p> : null}
          </div>
        );

        return item.href ? (
          <Link key={`${item.title}-${item.href}`} href={item.href} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--deck-accent)]">
            {content}
          </Link>
        ) : (
          <div key={`${item.title}-${item.meta ?? ""}`}>{content}</div>
        );
      })}
    </div>
  );
}

export function RecordEditForm({
  title = "Record Information",
  description,
  action,
  recordIdName,
  recordId,
  backTo,
  fields,
  values,
}: {
  title?: string;
  description?: string;
  action: (formData: FormData) => void | Promise<void>;
  recordIdName: string;
  recordId: string;
  backTo: string;
  fields: DetailFormField[];
  values: Record<string, DetailValue>;
}) {
  return (
    <SectionCard title={title} description={description} icon="settings">
      <form action={action} className="grid gap-5">
        <input type="hidden" name={recordIdName} value={recordId} />
        <input type="hidden" name="back_to" value={backTo} />
        <div className="grid gap-4 md:grid-cols-2">
          {fields.map((field) => (
            <div key={field.name} className={cn("grid gap-2", field.fullWidth && "md:col-span-2")}>
              <label htmlFor={field.name} className="deck-eyebrow !text-[0.6rem] !text-[var(--deck-text-2)]">
                {field.label}
                {field.required ? <span className="ml-1 text-[var(--deck-accent-ink)]">*</span> : null}
              </label>
              <FieldInput field={field} values={values} />
            </div>
          ))}
        </div>
        <div className="flex justify-end border-t border-[var(--deck-line)] pt-4">
          <SubmitButton pendingText="Saving...">
            Save changes
          </SubmitButton>
        </div>
      </form>
    </SectionCard>
  );
}
