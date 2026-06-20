import "server-only";

import homeContent from "@/content/site/home.json";
import aboutContent from "@/content/site/about.json";
import servicesContent from "@/content/site/services.json";
import aircraftSupportContent from "@/content/site/aircraft-support.json";
import crewNetworkContent from "@/content/site/crew-network.json";
import plansContent from "@/content/site/plans.json";
import contactContent from "@/content/site/contact.json";
import faqsContent from "@/content/site/faqs.json";
import legalContent from "@/content/site/legal.json";
import amgConnectContent from "@/content/site/amg-connect.json";
import { IMG } from "@/lib/site-media";

export type WebsiteContentSection = {
  enabled: boolean;
  eyebrow?: string;
  headline?: string;
  body?: string;
  primaryCtaLabel?: string;
  primaryCtaHref?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  imageKey?: string;
};

export type WebsiteContentPage = {
  page: string;
  version: number;
  seo: {
    title: string;
    description: string;
  };
  sections: Record<string, WebsiteContentSection>;
};

export type WebsiteContentHeroProps = {
  eyebrow: string;
  title: string;
  lead?: string;
  image: string;
  imageAlt?: string;
  position?: string;
  primary?: { label: string; href: string };
  secondary?: { label: string; href: string };
};

export const WEBSITE_CONTENT_PAGES = [
  { slug: "home", label: "Home", file: "content/site/home.json" },
  { slug: "about", label: "About", file: "content/site/about.json" },
  { slug: "services", label: "Services / Capabilities", file: "content/site/services.json" },
  { slug: "aircraft-support", label: "Aircraft Support", file: "content/site/aircraft-support.json" },
  { slug: "crew-network", label: "Crew Network", file: "content/site/crew-network.json" },
  { slug: "plans", label: "Plans", file: "content/site/plans.json" },
  { slug: "contact", label: "Contact", file: "content/site/contact.json" },
  { slug: "faqs", label: "FAQs", file: "content/site/faqs.json" },
  { slug: "legal", label: "Legal / Disclaimers", file: "content/site/legal.json" },
  { slug: "amg-connect", label: "AMG Connect", file: "content/site/amg-connect.json" },
] as const;

export type WebsiteContentSlug = (typeof WEBSITE_CONTENT_PAGES)[number]["slug"];

export const APPROVED_IMAGE_KEYS = {
  generatedHeroPoster: IMG.generatedHeroPoster,
  generatedCrewMap: IMG.generatedCrewMap,
  generatedDispatch: IMG.generatedDispatch,
  aboutOperations: IMG.aboutOperations,
  servicesHero: IMG.servicesHero,
  aircraftSupportMain: IMG.aircraftSupportMain,
  contactSupport: IMG.contactSupport,
  plansSelector: IMG.plansSelector,
  portalClientDashboard: "/images/portal-screenshots/portal-client-dashboard-enhanced.webp",
  portalClientRequests: "/images/portal-screenshots/portal-client-requests-enhanced.webp",
  portalClientAircraft: "/images/portal-screenshots/portal-client-aircraft-enhanced.webp",
  portalClientDocuments: "/images/portal-screenshots/portal-client-documents-enhanced.webp",
  portalCrewDashboard: "/images/portal-screenshots/portal-crew-dashboard-enhanced.webp",
  portalAdminDashboard: "/images/portal-screenshots/portal-admin-dashboard-enhanced.webp",
} as const;

const liveContent: Record<WebsiteContentSlug, WebsiteContentPage> = {
  home: homeContent,
  about: aboutContent,
  services: servicesContent,
  "aircraft-support": aircraftSupportContent,
  "crew-network": crewNetworkContent,
  plans: plansContent,
  contact: contactContent,
  faqs: faqsContent,
  legal: legalContent,
  "amg-connect": amgConnectContent,
};

export function isWebsiteEditorEnabled() {
  return process.env.WEBSITE_EDITOR_ENABLED !== "false";
}

export function isWebsiteContentSlug(value: unknown): value is WebsiteContentSlug {
  return typeof value === "string" && WEBSITE_CONTENT_PAGES.some((page) => page.slug === value);
}

export function getWebsiteContentPage(slug: WebsiteContentSlug): WebsiteContentPage {
  return liveContent[slug];
}

export function getWebsiteContentPageMeta(slug: WebsiteContentSlug) {
  return WEBSITE_CONTENT_PAGES.find((page) => page.slug === slug)!;
}

export function approvedContentPathForSlug(slug: WebsiteContentSlug) {
  return getWebsiteContentPageMeta(slug).file;
}

export function assertApprovedContentPath(filePath: string) {
  const normalized = filePath.replace(/\\/g, "/");
  if (!WEBSITE_CONTENT_PAGES.some((page) => page.file === normalized)) {
    throw new Error("Only approved content/site files may be modified.");
  }
  if (normalized.includes("..") || normalized.startsWith("/") || /^[a-zA-Z]:/.test(normalized)) {
    throw new Error("Content path traversal is not allowed.");
  }
  return normalized;
}

export function imageSrcForKey(key: string | undefined) {
  if (!key) return null;
  return APPROVED_IMAGE_KEYS[key as keyof typeof APPROVED_IMAGE_KEYS] ?? null;
}

export function metadataForWebsiteContent(slug: WebsiteContentSlug, fallback: WebsiteContentPage["seo"]) {
  const content = getWebsiteContentPage(slug);
  return {
    title: content.seo.title || fallback.title,
    description: content.seo.description || fallback.description,
  };
}

export function heroForWebsiteContent(slug: WebsiteContentSlug, fallback: WebsiteContentHeroProps): WebsiteContentHeroProps {
  const content = getWebsiteContentPage(slug);
  const hero = content.sections.hero;
  if (!hero?.enabled) return fallback;

  return {
    ...fallback,
    eyebrow: hero.eyebrow?.trim() || fallback.eyebrow,
    title: hero.headline?.trim() || fallback.title,
    lead: hero.body?.trim() || fallback.lead,
    image: imageSrcForKey(hero.imageKey) ?? fallback.image,
    primary:
      hero.primaryCtaLabel?.trim() && hero.primaryCtaHref?.trim()
        ? { label: hero.primaryCtaLabel, href: hero.primaryCtaHref }
        : fallback.primary,
    secondary:
      hero.secondaryCtaLabel?.trim() && hero.secondaryCtaHref?.trim()
        ? { label: hero.secondaryCtaLabel, href: hero.secondaryCtaHref }
        : fallback.secondary,
  };
}

function containsUnsafeMarkup(value: string) {
  return /<\s*script|<\/\s*script|on\w+\s*=|<\s*iframe|javascript:/i.test(value);
}

function safeHref(value: string) {
  if (!value) return true;
  if (value.startsWith("/")) return !value.startsWith("//");
  if (value.startsWith("mailto:")) return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value.slice("mailto:".length));
  try {
    const url = new URL(value);
    return url.protocol === "https:" && ["amgaviationgroup.com", "www.amgaviationgroup.com"].includes(url.hostname);
  } catch {
    return false;
  }
}

export function validateWebsiteContent(input: unknown): { ok: true; content: WebsiteContentPage } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  const value = input as Partial<WebsiteContentPage>;
  if (!value || typeof value !== "object") return { ok: false, errors: ["Content must be an object."] };
  if (!isWebsiteContentSlug(value.page)) errors.push("Unknown page slug.");
  if (value.version !== 1) errors.push("Unsupported content version.");
  if (!value.seo || typeof value.seo !== "object") errors.push("SEO block is required.");
  if (!value.seo?.title?.trim()) errors.push("SEO title is required.");
  if ((value.seo?.title ?? "").length > 70) errors.push("SEO title should be 70 characters or less.");
  if (!value.seo?.description?.trim()) errors.push("SEO description is required.");
  if ((value.seo?.description ?? "").length > 170) errors.push("SEO description should be 170 characters or less.");
  if (!value.sections || typeof value.sections !== "object") errors.push("Sections block is required.");

  for (const [sectionKey, section] of Object.entries(value.sections ?? {})) {
    if (!section || typeof section !== "object") {
      errors.push(`${sectionKey} must be a section object.`);
      continue;
    }
    const typed = section as WebsiteContentSection;
    if (typeof typed.enabled !== "boolean") errors.push(`${sectionKey} enabled flag is required.`);
    const textFields = [
      typed.eyebrow,
      typed.headline,
      typed.body,
      typed.primaryCtaLabel,
      typed.secondaryCtaLabel,
    ].filter((item): item is string => typeof item === "string");
    if (textFields.some(containsUnsafeMarkup)) errors.push(`${sectionKey} contains unsafe markup.`);
    if (typed.enabled && !typed.headline?.trim()) errors.push(`${sectionKey} needs a headline when enabled.`);
    if (typed.primaryCtaHref && !typed.primaryCtaLabel) errors.push(`${sectionKey} has a primary CTA URL without a label.`);
    if (typed.secondaryCtaHref && !typed.secondaryCtaLabel) errors.push(`${sectionKey} has a secondary CTA URL without a label.`);
    if (typed.primaryCtaHref && !safeHref(typed.primaryCtaHref)) errors.push(`${sectionKey} has an unsafe primary CTA URL.`);
    if (typed.secondaryCtaHref && !safeHref(typed.secondaryCtaHref)) errors.push(`${sectionKey} has an unsafe secondary CTA URL.`);
    if (typed.imageKey && !imageSrcForKey(typed.imageKey)) errors.push(`${sectionKey} uses an unapproved image reference.`);
  }

  if (errors.length) return { ok: false, errors };
  return { ok: true, content: value as WebsiteContentPage };
}

export function contentFromEditorForm(formData: FormData): { ok: true; content: WebsiteContentPage } | { ok: false; errors: string[] } {
  const slug = String(formData.get("page_slug") ?? "");
  if (!isWebsiteContentSlug(slug)) return { ok: false, errors: ["Unknown page slug."] };
  const current = getWebsiteContentPage(slug);
  const sections: WebsiteContentPage["sections"] = {};

  for (const sectionKey of Object.keys(current.sections)) {
    sections[sectionKey] = {
      enabled: formData.get(`section.${sectionKey}.enabled`) === "true",
      eyebrow: String(formData.get(`section.${sectionKey}.eyebrow`) ?? "").trim(),
      headline: String(formData.get(`section.${sectionKey}.headline`) ?? "").trim(),
      body: String(formData.get(`section.${sectionKey}.body`) ?? "").trim(),
      primaryCtaLabel: String(formData.get(`section.${sectionKey}.primaryCtaLabel`) ?? "").trim(),
      primaryCtaHref: String(formData.get(`section.${sectionKey}.primaryCtaHref`) ?? "").trim(),
      secondaryCtaLabel: String(formData.get(`section.${sectionKey}.secondaryCtaLabel`) ?? "").trim(),
      secondaryCtaHref: String(formData.get(`section.${sectionKey}.secondaryCtaHref`) ?? "").trim(),
      imageKey: String(formData.get(`section.${sectionKey}.imageKey`) ?? "").trim(),
    };
  }

  return validateWebsiteContent({
    page: slug,
    version: 1,
    seo: {
      title: String(formData.get("seo.title") ?? "").trim(),
      description: String(formData.get("seo.description") ?? "").trim(),
    },
    sections,
  });
}

export function stringifyContent(content: WebsiteContentPage) {
  return `${JSON.stringify(content, null, 2)}\n`;
}
