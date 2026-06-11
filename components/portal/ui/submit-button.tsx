"use client";

import { useFormStatus } from "react-dom";
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
}: {
  children: React.ReactNode;
  pendingText?: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  confirm?: string;
  name?: string;
  value?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant={variant}
      size={size}
      name={name}
      value={value}
      disabled={pending}
      className={cn(className)}
      onClick={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      {pending && pendingText ? pendingText : children}
    </Button>
  );
}
