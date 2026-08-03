import "server-only";

import fs from "fs";
import path from "path";

/**
 * Shared primitives for generated PDFs.
 *
 * Scope is deliberately narrow. `billing-pdfs.tsx` keeps its own styles and
 * document structure — it produces financial artifacts whose layout is settled,
 * and refactoring it to share a stylesheet with a new document type would risk
 * a working billing path for no user-visible gain. Only genuinely identical,
 * side-effect-free helpers live here.
 */

/**
 * Read a public asset into a base64 data URI.
 *
 * @react-pdf cannot resolve relative URLs, so images have to be inlined.
 * Returns null on any failure so a missing logo degrades to a text wordmark
 * rather than failing the render.
 */
export function logoDataUri(logoPath: string): string | null {
  const safePath = logoPath.startsWith("/") ? logoPath.slice(1) : logoPath;
  const fullPath = path.join(process.cwd(), "public", safePath.replace(/^public\//, ""));
  try {
    const ext = path.extname(fullPath).toLowerCase().replace(".", "") || "png";
    return `data:image/${ext};base64,${fs.readFileSync(fullPath).toString("base64")}`;
  } catch {
    return null;
  }
}

/** Palette shared by generated documents, matching the billing PDFs. */
export const PDF_COLORS = {
  text: "#162033",
  heading: "#0c2242",
  muted: "#526070",
  mutedLight: "#6d7a89",
  rule: "#d7dee8",
  ruleLight: "#edf1f5",
  fill: "#eef2f6",
  danger: "#b3261e",
  warn: "#8a5a00",
  success: "#1c6b45",
} as const;
