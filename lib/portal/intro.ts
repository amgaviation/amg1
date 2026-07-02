export const PORTAL_INTRO_PENDING_KEY = "amg-connect-intro-pending";
export const PORTAL_INTRO_SEEN_KEY = "amg-connect-intro-seen";
export const PORTAL_INTRO_PENDING_COOKIE = "amg-connect-intro-pending";
export const PORTAL_INTRO_PENDING_COOKIE_MAX_AGE_SECONDS = 120;

export const PORTAL_INTRO_ASSETS = {
  mp4: "/video/amg-connect-login-intro.mp4",
  webm: "/video/amg-connect-login-intro.webm",
  poster: "/video/amg-connect-login-intro-poster.jpg",
  fallbackLogo: "/images/logo-white.png",
} as const;

export function isApprovedPortalIntroStatus(status: string | null | undefined) {
  return status === "approved";
}

export function clearPortalIntroBrowserState() {
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(PORTAL_INTRO_PENDING_KEY);
    window.sessionStorage.removeItem(PORTAL_INTRO_SEEN_KEY);
  }

  if (typeof document !== "undefined") {
    document.cookie = `${PORTAL_INTRO_PENDING_COOKIE}=; Max-Age=0; Path=/portal; SameSite=Lax`;
    document.cookie = `${PORTAL_INTRO_PENDING_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax`;
  }
}
