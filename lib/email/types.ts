export type EmailAddress = {
  email: string;
  name?: string | null;
};

export type EmailAttachmentInput = {
  filename: string;
  content: string;
  contentType?: string | null;
};

export type SendEmailInput = {
  from?: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  replyTo?: string;
  subject: string;
  text: string;
  html?: string | null;
  headers?: Record<string, string>;
  attachments?: EmailAttachmentInput[];
  /**
   * Tolerate provider rate limiting by retrying with backoff.
   *
   * Set by bulk senders only. A campaign wakes hundreds of durable workflows at
   * the same instant and each one calls the provider immediately, which is far
   * above any per-account request limit — without this every call past the
   * limit returns 429 and is discarded as a permanent failure. Interactive mail
   * (password resets, notifications) leaves it off: a user waiting on a screen
   * should get an error quickly, not a minute of silent retries.
   */
  retryOnRateLimit?: boolean;
};

export type SendEmailResult =
  | { ok: true; provider: string; providerMessageId: string | null; status: "sent" | "suppressed" }
  | { ok: false; provider: string; status: "failed" | "suppressed"; error: string };

export type NormalizedInboundAttachment = {
  fileName: string;
  contentType?: string | null;
  size?: number | null;
  contentBase64?: string | null;
};

export type NormalizedInboundMessage = {
  eventId: string;
  provider: string;
  providerMessageId?: string | null;
  providerThreadId?: string | null;
  inReplyTo?: string | null;
  references?: string | null;
  fromEmail: string;
  fromName?: string | null;
  toEmails: string[];
  ccEmails?: string[];
  subject: string;
  bodyText?: string | null;
  bodyHtml?: string | null;
  rawHeaders?: Record<string, unknown> | null;
  rawPayload?: Record<string, unknown> | null;
  receivedAt?: string | null;
  attachments?: NormalizedInboundAttachment[];
};

export type EmailProvider = {
  name: string;
  configured(): boolean;
  sendEmail(input: SendEmailInput): Promise<SendEmailResult>;
  validateWebhookSignature?(payload: string, headers: Headers): Promise<boolean>;
};
