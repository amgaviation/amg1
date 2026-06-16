import { SiteNav } from "@/components/site/site-nav";
import { SiteFooter } from "@/components/site/site-footer";
import { InteractionLayer } from "@/components/site/interaction-layer";
import { SmoothScroll } from "@/components/site/smooth-scroll";
import { MobileActionBar } from "@/components/site/mobile-action-bar";

const publicVisibilityCss = `
  .public-site main,
  .public-site [data-scroll-animate],
  .public-site [data-stagger-container],
  .public-site [data-stagger-item],
  .public-site [data-process-step] {
    opacity: 1;
    visibility: visible;
    transform: none;
    filter: none;
  }

  .public-site [data-scroll-animate],
  .public-site [data-stagger-item],
  .public-site [data-process-step] {
    transition-property: border-color, background-color, box-shadow, color;
    will-change: auto;
  }
`;

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="public-site amg-oc flex min-h-screen flex-col">
      <InteractionLayer />
      <SmoothScroll />
      <style dangerouslySetInnerHTML={{ __html: publicVisibilityCss }} />
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
