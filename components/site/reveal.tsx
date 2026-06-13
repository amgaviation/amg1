import type { ComponentPropsWithoutRef, ReactNode } from "react";

export function Reveal({
  children,
  className,
  variants,
  ...props
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  variants?: unknown;
} & ComponentPropsWithoutRef<"div">) {
  void variants;
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
}

export function RevealGroup({
  children,
  className,
  stagger = 0.12,
  ...props
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
} & ComponentPropsWithoutRef<"div">) {
  void stagger;
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
}

export function RevealItem({
  children,
  className,
  ...props
}: {
  children: ReactNode;
  className?: string;
} & ComponentPropsWithoutRef<"div">) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
}
