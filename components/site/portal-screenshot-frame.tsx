import Image from "next/image";
import { cn } from "@/lib/utils";

export function PortalScreenshotFrame({
  src,
  alt,
  caption,
  variant = "browser",
  priority,
  className,
}: {
  src: string;
  alt: string;
  caption?: string;
  variant?: "desktop" | "mobile" | "browser" | "floating" | "dark";
  priority?: boolean;
  className?: string;
}) {
  const isMobile = variant === "mobile";
  return (
    <figure
      className={cn(
        "group relative mx-auto w-full overflow-hidden border border-white/12 bg-slate-950/70 shadow-[0_34px_110px_rgba(0,0,0,0.34)]",
        isMobile ? "max-w-[24rem] rounded-[2rem] p-2" : "rounded-2xl",
        variant === "floating" && "shadow-[0_28px_90px_rgba(8,20,36,0.2)]",
        className,
      )}
    >
      {variant === "browser" ? (
        <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.04] px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-white/18" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/18" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/18" />
          <span className="oc-mono ml-2 truncate text-[0.68rem] text-[var(--oc-aluminum-2)]">AMG Aviation Portal</span>
        </div>
      ) : null}
      <div
        className={cn(
          "relative overflow-hidden bg-slate-900",
          isMobile ? "aspect-[390/844] rounded-[1.5rem]" : "aspect-[1440/1000]",
        )}
      >
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes={isMobile ? "(max-width: 768px) 80vw, 390px" : "(max-width: 1024px) 100vw, 56vw"}
          className="object-cover"
        />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),transparent_28%,rgba(0,0,0,0.18))]" />
      </div>
      {caption ? <figcaption className="px-4 py-3 text-xs text-[var(--oc-aluminum-2)]">{caption}</figcaption> : null}
    </figure>
  );
}
