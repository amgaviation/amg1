"use client";

import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { useRef } from "react";

type MagneticLinkProps = ComponentPropsWithoutRef<typeof Link> & {
  children: ReactNode;
  className?: string;
  cursorLabel?: string;
};

export function MagneticLink({
  children,
  className,
  cursorLabel,
  onMouseMove,
  onMouseLeave,
  ...props
}: MagneticLinkProps) {
  const ref = useRef<HTMLAnchorElement>(null);

  return (
    <Link
      {...props}
      ref={ref}
      className={className}
      data-cursor={cursorLabel}
      onMouseMove={(event) => {
        const rect = ref.current?.getBoundingClientRect();
        if (rect) {
          const x = (event.clientX - rect.left - rect.width / 2) * 0.22;
          const y = (event.clientY - rect.top - rect.height / 2) * 0.22;
          ref.current?.style.setProperty("--magnet-x", `${x}px`);
          ref.current?.style.setProperty("--magnet-y", `${y}px`);
        }
        onMouseMove?.(event);
      }}
      onMouseLeave={(event) => {
        ref.current?.style.setProperty("--magnet-x", "0px");
        ref.current?.style.setProperty("--magnet-y", "0px");
        onMouseLeave?.(event);
      }}
    >
      {children}
    </Link>
  );
}
