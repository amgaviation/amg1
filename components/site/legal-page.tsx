import type { ReactNode } from "react";

export function LegalPage({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-background px-6 pb-24 pt-36 lg:px-10">
      <article className="mx-auto max-w-3xl">
        <p className="eyebrow mb-5 text-accent">{eyebrow}</p>
        <h1 className="display-heading text-balance text-5xl text-foreground sm:text-6xl">
          {title}
        </h1>
        <div className="mt-10 space-y-6 text-base leading-relaxed text-muted-foreground">
          {children}
        </div>
      </article>
    </main>
  );
}
