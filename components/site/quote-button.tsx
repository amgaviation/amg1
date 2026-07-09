import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * The site's signature CTA — the flight-deck home's glowing instrument-blue
 * pill with a paper-plane that rotates on hover. Reused for the primary
 * action on the secondary marketing pages so the brand button carries across
 * the whole site (transition-only, reduced-motion safe).
 */
export function QuoteButton({
  href = "/request",
  children = "Get a Quote",
  className,
  prefetch = false,
}: {
  href?: string;
  children?: React.ReactNode;
  className?: string;
  prefetch?: boolean;
}) {
  return (
    <Link
      href={href}
      prefetch={prefetch}
      className={cn(
        "group inline-flex items-center gap-2.5 rounded-full bg-[var(--instrument)] py-2 pl-6 pr-2 text-white shadow-[0_0_40px_rgba(11,94,212,0.30)] transition-shadow hover:shadow-[0_0_60px_rgba(11,94,212,0.5)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--instrument-ink)]",
        className
      )}
    >
      <span className="whitespace-nowrap font-mono text-xs font-medium uppercase [letter-spacing:0.14em]">
        {children}
      </span>
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--canvas)] text-[var(--instrument-ink)] transition-transform duration-500 ease-out group-hover:rotate-45">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M21 3L9.5 14.5M21 3l-6.5 18-3-8.5L3 9.5 21 3z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </Link>
  );
}
