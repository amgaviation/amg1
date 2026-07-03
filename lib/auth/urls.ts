import { absoluteSiteUrl } from "@/lib/email/config";

type AuthConfirmType = "email" | "signup" | "invite" | "magiclink" | "recovery" | "email_change";

export function authRedirectUrl(path: `/auth/${string}`) {
  return absoluteSiteUrl(path);
}

export function authConfirmUrl(input: {
  tokenHash: string;
  type: AuthConfirmType;
  redirectTo?: string | null;
}) {
  const params = new URLSearchParams({
    token_hash: input.tokenHash,
    type: input.type,
  });

  if (input.redirectTo) {
    params.set("redirect_to", input.redirectTo);
  }

  return authRedirectUrl(`/auth/confirm?${params.toString()}`);
}

export function passwordSetupConfirmUrl(tokenHash: string) {
  return authConfirmUrl({ tokenHash, type: "recovery" });
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
