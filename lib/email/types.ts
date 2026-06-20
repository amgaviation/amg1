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
  validateWebhookSignature?(payload: string, signature: string | null): Promise<boolean>;
};
