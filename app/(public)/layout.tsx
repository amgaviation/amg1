import { SiteNav } from "@/components/site/site-nav";
import { SiteFooter } from "@/components/site/site-footer";
import { InteractionLayer } from "@/components/site/interaction-layer";
import { PublicPageTransition } from "@/components/site/page-transition";

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
      <PublicPageTransition>
        {children}
      </PublicPageTransition>
      <SiteFooter />
    </div>
  );
}
