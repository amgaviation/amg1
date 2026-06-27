alter table public.communication_messages
  add column if not exists email_category text,
  add column if not exists template_id uuid references public.communication_templates(id) on delete set null,
  add column if not exists template_name text,
  add column if not exists body_preview text;

create index if not exists communication_messages_email_category_idx
  on public.communication_messages (email_category);

create index if not exists communication_messages_template_id_idx
  on public.communication_messages (template_id);

create index if not exists communication_messages_sent_at_idx
  on public.communication_messages (sent_at);
