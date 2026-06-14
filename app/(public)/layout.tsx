import { SiteNav } from "@/components/site/site-nav";
import { SiteFooter } from "@/components/site/site-footer";
import { InteractionLayer } from "@/components/site/interaction-layer";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="public-site flex min-h-screen flex-col bg-background">
      <InteractionLayer />
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <SiteNav />
      {/*
        Content renders in a plain <main> so it is visible by default even if
        JavaScript never runs. Do not wrap this in a motion/page-transition
        component that sets an initial hidden state — that hides content before
        hydration.
      */}
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
