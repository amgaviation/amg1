/**
 * 3 Green Studios — single source of truth for brand strings.
 *
 * Everything renameable lives here: display name, nav short form, tagline,
 * contact address, and the one real portfolio URL. Changing the studio name is
 * a one-line edit to `BRAND.name` (and `BRAND.shortName` for the nav mark).
 *
 * Numeral convention: the numeral "3", never the word "Three" — including in
 * the <title> and OG tags. The one exception is TAGLINES[1], which is quoted
 * verbatim from the brief ("Three green. Cleared to build."). If Tony picks
 * that one, decide whether to respell it "3 green." before shipping.
 */

export const BRAND = {
  /** Full display name. Used in headings, meta, footer, schema. */
  name: "3 Green Studios",
  /** Condensed form for the nav mark and tight spaces. */
  shortName: "3 Green",
  /**
   * The three taglines supplied in the brief, in the brief's order. Tony picks
   * one; the site reads only `TAGLINE` below, so switching is a one-line change
   * to `TAGLINE_INDEX`. Do not invent new taglines here.
   */
  taglines: [
    "Down and locked.",
    "Three green. Cleared to build.",
    "Everything checks out.",
  ],
  /**
   * PLACEHOLDER EMAIL — not a live inbox as of 2026-07-30. Tony has not yet
   * chosen the real studio address. Replace this one string and every mailto,
   * form target, and footer link on the site updates with it.
   */
  email: "hello@3greenstudios.com",
  /** Where the studio works from. No street address published. */
  location: "Florida, USA",
  locationLong: "Florida, USA · serving aviation nationwide",
  /**
   * Intended primary domain. NOT yet confirmed at the registrar and not
   * trademark-screened as of 2026-07-30 — Tony is verifying. Used only for
   * canonical/OG metadata, so a change here is safe and local.
   */
  domain: "3greenstudios.com",
  url: "https://3greenstudios.com",
} as const;

/**
 * Tagline selection. 0 = "Down and locked." (current default — the shortest of
 * the three, and it leaves the gear-down interaction to carry the concept).
 * 1 = "Three green. Cleared to build."  2 = "Everything checks out."
 */
export const TAGLINE_INDEX = 0;
export const TAGLINE = BRAND.taglines[TAGLINE_INDEX];

/** The one real client. Verified HTTP 200 on 2026-07-30. */
export const PORTFOLIO = {
  client: "AMG Aviation Group",
  url: "https://www.amgaviationgroup.com",
  host: "amgaviationgroup.com",
} as const;

/** Nav anchors, in order. `href` values must match section ids in page.tsx. */
export const NAV_LINKS = [
  { href: "#work", label: "Work" },
  { href: "#services", label: "Services" },
  { href: "#process", label: "Process" },
  { href: "#contact", label: "Contact" },
] as const;

/**
 * Prefilled mailto used by both CTAs and the contact form fallback. Kept here
 * so the subject line stays consistent everywhere it is offered.
 */
export const QUOTE_MAILTO = `mailto:${BRAND.email}?subject=${encodeURIComponent(
  "Fixed-scope quote request",
)}`;
