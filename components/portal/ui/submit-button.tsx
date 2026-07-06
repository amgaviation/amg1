"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

type Variant = ComponentProps<typeof Button>["variant"];
type Size = ComponentProps<typeof Button>["size"];

/**
 * Form submit button with pending state and an optional confirm dialog for
 * destructive or irreversible actions.
 */
export function SubmitButton({
  children,
  pendingText,
  variant = "default",
  size = "default",
  className,
  confirm,
  name,
  value,
  disabled = false,
}: {
  children: React.ReactNode;
  pendingText?: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  confirm?: string;
  name?: string;
  value?: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  function confirmSubmit() {
    setConfirmOpen(false);
    buttonRef.current?.form?.requestSubmit(buttonRef.current);
  }

  return (
    <>
      <Button
        ref={buttonRef}
        type="submit"
        variant={variant}
        size={size}
        name={name}
        value={value}
        disabled={pending || disabled}
        className={cn(className)}
        onClick={(event) => {
          if (!confirm) return;
          event.preventDefault();
          setConfirmOpen(true);
        }}
      >
        {pending && pendingText ? pendingText : children}
      </Button>

      {confirmOpen ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-[rgba(10,19,34,0.6)] p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-action-title"
        >
          <div className="deck-card max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto p-6">
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--deck-warn-line)] bg-[var(--deck-warn-tint)]">
                <AlertTriangle className="h-5 w-5 text-[var(--deck-warn)]" />
              </span>
              <div>
                <p className="deck-eyebrow">Confirm Action</p>
                <h2
                  id="confirm-action-title"
                  className="deck-title mt-1.5 text-lg"
                >
                  Review before continuing
                </h2>
                <p className="mt-2.5 text-sm leading-6 text-[var(--deck-text-2)]">
                  {confirm}
                </p>
              </div>
            </div>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant={variant === "destructive" ? "destructive" : "default"}
                onClick={confirmSubmit}
              >
                Continue
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
