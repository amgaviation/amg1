import type { ReactNode } from "react";

export function Reveal({
  children,
  className,
  variants,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  variants?: unknown;
}) {
  void variants;
  return <div className={className}>{children}</div>;
}

export function RevealGroup({
  children,
  className,
  stagger = 0.12,
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
}) {
  void stagger;
  return <div className={className}>{children}</div>;
}

export function RevealItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}
