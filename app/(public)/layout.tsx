import { SiteNav } from "@/components/site/site-nav";
import { SiteFooter } from "@/components/site/site-footer";
import { InteractionLayer } from "@/components/site/interaction-layer";
import { SmoothScroll } from "@/components/site/smooth-scroll";
import { MobileActionBar } from "@/components/site/mobile-action-bar";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="public-site amg-oc flex min-h-screen flex-col">
      <InteractionLayer />
      <SmoothScroll />
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <SiteNav />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <SiteFooter />
      <MobileActionBar />
    </div>
  );
}
