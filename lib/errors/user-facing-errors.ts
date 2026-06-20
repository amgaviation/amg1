export const AMG_SUPPORT_EMAIL = "information@amgaviationgroup.com";

export type ErrorAudience = "public" | "client" | "crew" | "vendor" | "admin";
export type ErrorArea =
  | "public_contact"
  | "request_support"
  | "pilot_network"
  | "client_portal"
  | "crew_portal"
  | "vendor_portal"
  | "admin_portal"
  | "communications"
  | "billing"
  | "quotes"
  | "invoices"
  | "documents"
  | "aircraft"
  | "crew"
  | "clients"
  | "auth"
  | "profile"
  | "dashboard"
  | "unknown";
export type ErrorAction =
  | "load"
  | "submit"
  | "save"
  | "send"
  | "receive"
  | "upload"
  | "download"
  | "delete"
  | "update"
  | "create"
  | "authenticate"
  | "authorize"
  | "payment"
  | "quote"
  | "invoice"
  | "message"
  | "unknown";
export type ErrorCategory =
  | "unavailable"
  | "validation"
  | "permission"
  | "not_found"
  | "timeout"
  | "upload_failed"
  | "send_failed"
  | "receive_failed"
  | "payment_failed"
  | "configuration_missing"
  | "unknown";

export type UserFacingErrorInput = {
  audience?: ErrorAudience;
  area?: ErrorArea;
  action?: ErrorAction;
  category?: ErrorCategory;
  fallback?: string;
  correlationId?: string;
};

export type SafeErrorResponse = {
  ok: false;
  code: string;
  message: string;
  referenceId?: string;
};

const contact = `Please contact ${AMG_SUPPORT_EMAIL} for additional assistance.`;

const areaActionMessages: Partial<Record<ErrorArea, Partial<Record<ErrorAction, string>>>> = {
  public_contact: {
    submit: `We could not submit your message right now. ${contact}`,
    save: `We could not submit your message right now. ${contact}`,
  },
  request_support: {
    submit: `Your support request could not be submitted at this time. ${contact}`,
    save: `Your support request could not be submitted at this time. ${contact}`,
  },
  pilot_network: {
    submit: `Your crew submission could not be completed at this time. ${contact}`,
  },
  communications: {
    load: `Messages are not available right now. ${contact}`,
    send: `This message could not be sent at this time. ${contact}`,
    receive: `This message could not be received at this time. ${contact}`,
    upload: `This attachment could not be uploaded at this time. ${contact}`,
    download: `This attachment is not available right now. ${contact}`,
    update: `This message could not be updated at this time. ${contact}`,
    create: `This message could not be created at this time. ${contact}`,
    message: `This message could not be sent at this time. ${contact}`,
  },
  billing: {
    payment: `This billing action could not be completed at this time. ${contact}`,
    load: `This billing section is not available right now. ${contact}`,
    send: `This billing message could not be sent at this time. ${contact}`,
  },
  quotes: {
    quote: `This quote is not available right now. ${contact}`,
    load: `This quote is not available right now. ${contact}`,
    send: `This quote could not be sent at this time. ${contact}`,
  },
  invoices: {
    invoice: `This invoice is not available right now. ${contact}`,
    load: `This invoice is not available right now. ${contact}`,
    send: `This invoice could not be sent at this time. ${contact}`,
  },
  documents: {
    upload: `This document could not be uploaded at this time. ${contact}`,
    download: `This document is not available right now. ${contact}`,
    load: `This document is not available right now. ${contact}`,
  },
  client_portal: {
    load: `This client portal section is not available right now. ${contact}`,
    update: `This client portal action could not be completed at this time. ${contact}`,
    create: `This support request action could not be completed at this time. ${contact}`,
  },
  crew_portal: {
    load: `This crew portal section is not available right now. ${contact}`,
    update: `This crew availability update could not be completed at this time. ${contact}`,
  },
  vendor_portal: {
    load: `This vendor portal feature is not available right now. ${contact}`,
    update: `This vendor portal action could not be completed at this time. ${contact}`,
  },
  admin_portal: {
    load: `This admin portal section is not available right now. Review system logs or contact the site administrator.`,
    update: `This action could not be completed. Review system logs or contact the site administrator.`,
  },
  auth: {
    authenticate: `We could not complete this sign-in action right now. Please try again or contact ${AMG_SUPPORT_EMAIL} for additional assistance.`,
    update: `We could not complete this password reset action right now. ${contact}`,
  },
};

const categoryMessages: Partial<Record<ErrorCategory, string>> = {
  permission: `This section is not available for your account. ${contact}`,
  not_found: `The requested item is not available. ${contact}`,
  upload_failed: `This document could not be uploaded at this time. ${contact}`,
  send_failed: `This message could not be sent at this time. ${contact}`,
  receive_failed: `Messages are not available right now. ${contact}`,
  payment_failed: `This billing action could not be completed at this time. ${contact}`,
  configuration_missing: `This feature is not available right now. ${contact}`,
};

export function createErrorReference(prefix = "AMG-ERR") {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 6; i += 1) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `${prefix}-${suffix}`;
}

export function getUserFacingErrorMessage(input: UserFacingErrorInput = {}) {
  const area = input.area ?? "unknown";
  const action = input.action ?? "unknown";
  const category = input.category ?? "unknown";
  const base =
    areaActionMessages[area]?.[action] ??
    categoryMessages[category] ??
    input.fallback ??
    `This feature is not available right now. ${contact}`;

  return input.correlationId ? `${base} Reference: ${input.correlationId}` : base;
}

export function safeErrorCode(input: Pick<UserFacingErrorInput, "area" | "action" | "category">) {
  const parts = [input.area ?? "unknown", input.action ?? input.category ?? "unknown"];
  return parts.join("_").toUpperCase().replace(/[^A-Z0-9]+/g, "_");
}

export function createSafeErrorResponse(input: UserFacingErrorInput): SafeErrorResponse {
  return {
    ok: false,
    code: safeErrorCode(input),
    message: getUserFacingErrorMessage(input),
    referenceId: input.correlationId,
  };
}

export function logServerError(
  label: string,
  error: unknown,
  context: Record<string, unknown> = {},
) {
  const referenceId = createErrorReference();
  console.error(label, {
    referenceId,
    error,
    ...context,
    timestamp: new Date().toISOString(),
  });
  return referenceId;
}
