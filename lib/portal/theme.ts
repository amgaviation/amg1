/**
 * Portal theme (AMG Manifest v4).
 *
 * The theme is a cookie so the server can render the `data-portal-theme`
 * attribute in the SSR HTML — no flash, no inline script. The attribute is
 * applied by `app/portal/layout.tsx` on the wrapper that also carries the
 * portal font variables; `ThemeToggle` flips it client-side and rewrites the
 * cookie so the next server render agrees. v4 defaults to the light
 * "Day Board"; dark is the "Night Ops" option.
 */
export const PORTAL_THEME_COOKIE = "amg-portal-theme";

export type PortalTheme = "light" | "dark";

export const DEFAULT_PORTAL_THEME: PortalTheme = "light";

export function resolvePortalTheme(
  value: string | null | undefined
): PortalTheme {
  return value === "light" || value === "dark" ? value : DEFAULT_PORTAL_THEME;
}
