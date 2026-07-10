alter table public.communication_messages
  add column if not exists idempotency_key text;

create unique index if not exists communication_messages_resend_idempotency_sent_idx
  on public.communication_messages (idempotency_key)
  where provider = 'resend'
    and direction = 'outbound'
    and status = 'sent'
    and idempotency_key is not null;
