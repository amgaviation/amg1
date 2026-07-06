-- Allow template-override families as communication_templates categories.
-- The composer picker filters to its own categories, so override rows for
-- crew/lead/network/system templates never appear there.

alter table public.communication_templates
  drop constraint if exists communication_templates_category_check;

alter table public.communication_templates
  add constraint communication_templates_category_check
  check (category = any (array[
    'support_request', 'crew_coordination', 'billing', 'documents',
    'maintenance', 'general', 'status_update',
    'crew', 'lead', 'network', 'system'
  ]::text[]));
