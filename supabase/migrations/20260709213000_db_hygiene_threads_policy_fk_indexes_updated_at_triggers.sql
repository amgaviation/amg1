-- 1) message_threads had RLS enabled with ZERO policies while its peer tables
-- (messages, thread_members) carry member-scoped session policies — a session
-- client read silently returns no rows. Mirror messages_member_select, using
-- the canonical is_approved_admin() (includes super_admin + status check)
-- and the initplan-friendly (select auth.uid()) form.
create policy threads_member_select on public.message_threads for select to public
  using (
    public.is_approved_admin()
    or exists (
      select 1 from public.thread_members tm
      where tm.thread_id = message_threads.id
        and tm.profile_id = (select auth.uid())
    )
  );

-- Defense-in-depth admin read policies on the contractor-financial trio
-- (deny-all today; primary access stays via the service client).
create policy vendor_invoices_admin_select on public.vendor_invoices for select to public
  using (public.is_approved_admin());
create policy vendor_invoice_lines_admin_select on public.vendor_invoice_lines for select to public
  using (public.is_approved_admin());
create policy vendor_receipts_admin_select on public.vendor_receipts for select to public
  using (public.is_approved_admin());

-- 2) Unindexed FKs on real join/filter paths in lib/portal/queries.ts
-- (line-item fetches, subscription plan/tier joins, credential joins).
create index if not exists idx_invoice_line_items_service_id on public.invoice_line_items (service_id);
create index if not exists idx_invoice_line_items_service_variant_id on public.invoice_line_items (service_variant_id);
create index if not exists idx_invoice_line_items_expense_id on public.invoice_line_items (expense_id);
create index if not exists idx_quote_line_items_service_id on public.quote_line_items (service_id);
create index if not exists idx_quote_line_items_service_variant_id on public.quote_line_items (service_variant_id);
create index if not exists idx_client_subscriptions_plan_id on public.client_subscriptions (plan_id);
create index if not exists idx_client_subscriptions_tier_id on public.client_subscriptions (tier_id);
create index if not exists idx_client_subscriptions_source_quote_id on public.client_subscriptions (source_quote_id);
create index if not exists idx_invoices_aircraft_id on public.invoices (aircraft_id);
create index if not exists idx_invoices_revised_from_invoice_id on public.invoices (revised_from_invoice_id);
create index if not exists idx_invoices_superseded_by_invoice_id on public.invoices (superseded_by_invoice_id);
create index if not exists idx_payments_receipt_document_id on public.payments (receipt_document_id);
create index if not exists idx_crew_credentials_document_id on public.crew_credentials (document_id);
create index if not exists idx_communication_attachments_message_id on public.communication_attachments (message_id);
create index if not exists idx_messages_sender_id on public.messages (sender_id);

-- 3) updated_at drift: these tables have an updated_at column maintained only
-- by ad-hoc TypeScript assignments (verified all app writes use now()-based
-- values, so the trigger changes nothing semantically — it just guarantees
-- the stamp on every write path). Attach the existing set_updated_at().
-- Legacy users/access_request_status deliberately excluded (slated for drop).
do $$
declare t text;
begin
  foreach t in array array[
    'billing_document_sequences','billing_settings','calendar_events',
    'client_subscriptions','communication_templates','communication_threads',
    'communication_user_state','contact_form_submissions','content_approvals',
    'crm_leads','documents','invoices','mission_crew_requests',
    'notification_deliveries','onboarding_items','ops_tasks','payments',
    'privacy_requests','role_permissions','service_price_variants',
    'service_variables','services','subscription_billing_invoices',
    'subscription_plan_tiers','subscription_plans','vendor_invoices'
  ] loop
    execute format(
      'create trigger set_%s_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      t, t
    );
  end loop;
end $$;
