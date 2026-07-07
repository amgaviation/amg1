"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRecordParam } from "@/components/portal/ui/use-record-param";

/**
 * Console Record Pattern dialogs. The SERVER page owns open state: it renders
 * <RecordModal> only when `?record=` (or `?new=` for FormModal) is present in
 * its searchParams, with the detail content server-rendered as children.
 * Mounting therefore means open; closing strips the URL param via
 * useRecordParam so back/refresh/deep links all behave.
 *
 * Full-screen sheet on mobile, centered window from `sm:` up. Focus is
 * trapped while open and returned on close; Esc and backdrop click dismiss.
 */

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Shared dialog chrome (backdrop, focus trap, Esc, scroll lock, mobile
 * sheet). Exported for client components that own their open state (e.g.
 * AdminRecordManager); URL-synced pages use RecordModal / FormModal below.
 */
export function DialogShell({
  labelledBy,
  onClose,
  wide,
  children,
}: {
  labelledBy: string;
  onClose: () => void;
  wide?: boolean;
  children: React.ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    if (!panel) return;

    // Initial focus: the close button (first focusable) — never a text field,
    // so opening a record doesn't pop the keyboard on mobile.
    const focusables = panel.querySelectorAll<HTMLElement>(FOCUSABLE);
    (focusables[0] ?? panel).focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const items = panel!.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[90]">
      <button
        type="button"
        aria-label="Close"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-[rgba(7,11,20,0.55)] backdrop-blur-[2px]"
      />
      <div className="pointer-events-none absolute inset-0 flex items-stretch justify-center sm:items-center sm:p-6">
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={labelledBy}
          tabIndex={-1}
          className={cn(
            "deck-modal-panel pointer-events-auto flex h-full w-full flex-col overflow-hidden bg-[var(--deck-panel)] outline-none",
            "sm:h-auto sm:max-h-[min(52rem,calc(100vh-3rem))] sm:rounded-lg sm:border sm:border-[var(--deck-line-strong)] sm:shadow-[0_24px_64px_-24px_rgba(7,11,20,0.45)]",
            wide ? "sm:max-w-4xl" : "sm:max-w-2xl"
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export function ModalHeader({
  id,
  eyebrow,
  title,
  meta,
  badge,
  onClose,
}: {
  id: string;
  eyebrow?: string;
  title: React.ReactNode;
  meta?: React.ReactNode;
  badge?: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <header className="flex items-start gap-3 border-b border-[var(--deck-line)] bg-[var(--deck-panel-2)] px-5 py-4 sm:px-6">
      <div className="min-w-0 flex-1">
        {eyebrow ? <p className="deck-eyebrow">{eyebrow}</p> : null}
        <div className="mt-1 flex flex-wrap items-center gap-2.5">
          <h2 id={id} className="min-w-0 break-words text-base font-semibold text-[var(--deck-text)]">
            {title}
          </h2>
          {badge}
        </div>
        {meta ? (
          <div className="mt-1 text-xs leading-5 text-[var(--deck-text-3)]">{meta}</div>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close window"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[var(--deck-line-strong)] text-[var(--deck-text-3)] transition-colors hover:border-[var(--deck-accent-line)] hover:text-[var(--deck-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--deck-accent)]"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    </header>
  );
}

/**
 * Record detail window. Render from the server page when `?record=<id>`
 * resolves to a record; pass the detail sections as children.
 */
export function RecordModal({
  eyebrow,
  title,
  meta,
  badge,
  actions,
  footer,
  wide,
  paramKeys = ["record"],
  children,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  meta?: React.ReactNode;
  badge?: React.ReactNode;
  /** Primary actions row rendered under the header (buttons/links). */
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
  /** URL params stripped on close (default `record`). */
  paramKeys?: string[];
  children: React.ReactNode;
}) {
  const { close } = useRecordParam(paramKeys);
  return (
    <DialogShell labelledBy="record-modal-title" onClose={close} wide={wide}>
      <ModalHeader
        id="record-modal-title"
        eyebrow={eyebrow}
        title={title}
        meta={meta}
        badge={badge}
        onClose={close}
      />
      {actions ? (
        <div
          data-portal-action-bar
          className="flex flex-wrap items-center gap-2 border-b border-[var(--deck-line)] px-5 py-3 sm:px-6"
        >
          {actions}
        </div>
      ) : null}
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
      {footer ? (
        <div className="border-t border-[var(--deck-line)] bg-[var(--deck-panel-2)] px-5 py-3 sm:px-6">
          {footer}
        </div>
      ) : null}
    </DialogShell>
  );
}

/**
 * Create/edit window. Render from the server page when its trigger param
 * (default `?new=`) is present; children are the form posting to the same
 * server action the old inline form used.
 */
export function FormModal({
  eyebrow,
  title,
  meta,
  wide,
  paramKeys = ["new"],
  children,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  meta?: React.ReactNode;
  wide?: boolean;
  /** URL params stripped on close (default `new`). */
  paramKeys?: string[];
  children: React.ReactNode;
}) {
  const { close } = useRecordParam(paramKeys);
  return (
    <DialogShell labelledBy="form-modal-title" onClose={close} wide={wide}>
      <ModalHeader id="form-modal-title" eyebrow={eyebrow} title={title} meta={meta} onClose={close} />
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
    </DialogShell>
  );
}
