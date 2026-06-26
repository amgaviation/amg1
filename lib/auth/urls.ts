import { absoluteSiteUrl } from "@/lib/email/config";

export function authRedirectUrl(path: `/auth/${string}`) {
  return absoluteSiteUrl(path);
}

export function passwordSetupRedirectUrl() {
  return authRedirectUrl("/auth/password-setup");
}

export function portalInviteRedirectUrl() {
  return authRedirectUrl("/auth/invite");
}

export function emailChangeRedirectUrl() {
  return authRedirectUrl("/auth/confirmed");
}
