"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

type Variant = ComponentProps<typeof Button>["variant"];
type Size = ComponentProps<typeof Button>["size"];

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
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="confirm-action-title">
          <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-5 text-slate-950 shadow-[0_28px_80px_rgba(8,20,36,0.28)]">
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-amber-200 bg-amber-50">
                <AlertTriangle className="h-5 w-5 text-amber-700" />
              </span>
              <div>
                <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-amber-700">Confirm Action</p>
                <h2 id="confirm-action-title" className="mt-2 font-display text-xl font-bold uppercase text-slate-950">
                  Review before continuing
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">{confirm}</p>
              </div>
            </div>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" className="rounded-full" onClick={() => setConfirmOpen(false)}>
                Cancel
              </Button>
              <Button type="button" variant={variant === "destructive" ? "destructive" : "default"} className="rounded-full" onClick={confirmSubmit}>
                Continue
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
