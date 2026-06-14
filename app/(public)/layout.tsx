import { SiteNav } from "@/components/site/site-nav";
import { SiteFooter } from "@/components/site/site-footer";

const emergencyVisibilityCss = `
  .public-site main,
  .public-site [data-scroll-animate],
  .public-site [data-stagger-container],
  .public-site [data-stagger-item],
  .public-site [data-process-step] {
    opacity: 1 !important;
    visibility: visible !important;
    transform: none !important;
    filter: none !important;
  }

  .public-site [data-scroll-animate],
  .public-site [data-stagger-item] {
    transition-property: border-color, background-color, box-shadow, color !important;
    will-change: auto !important;
  }
`;

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="public-site flex min-h-screen flex-col bg-background">
      <style dangerouslySetInnerHTML={{ __html: emergencyVisibilityCss }} />
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <SiteNav />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
