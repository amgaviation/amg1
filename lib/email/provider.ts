import "server-only";

import { resendProvider, emailProviderStatus } from "@/lib/email/resend-provider";

export function getEmailProvider() {
  return resendProvider;
}

export { emailProviderStatus };
