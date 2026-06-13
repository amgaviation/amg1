-- Default AMG subscription plan templates. Additive and idempotent.

do $$
declare
  v_plan_id uuid;
begin
  select id into v_plan_id
  from public.subscription_plans
  where name = 'Owner Support Essentials'
  limit 1;

  if v_plan_id is null then
    insert into public.subscription_plans (
      name,
      aircraft_category,
      description,
      status,
      billing_cadence_supported,
      base_admin_fee_monthly,
      base_admin_fee_annual,
      annual_discount_percent,
      default_terms
    )
    values (
      'Owner Support Essentials',
      'Piston, turboprop, and light jet',
      'Baseline AMG coordination for owner aircraft support, documents, crew readiness, and trip preparation.',
      'active',
      array['monthly', 'annual'],
      2500,
      27000,
      10,
      'Template pricing and allowances require AMG approval before becoming a binding service commitment.'
    )
    returning id into v_plan_id;
  end if;

  if not exists (
    select 1 from public.subscription_plan_tiers
    where plan_id = v_plan_id and name = 'Essentials'
  ) then
    insert into public.subscription_plan_tiers (
      plan_id,
      name,
      included_flights,
      included_mx_repositions,
      included_admin_hours,
      crew_day_rate,
      lodging_policy,
      travel_policy,
      priority_level,
      monthly_price,
      annual_price,
      sort_order
    )
    values (
      v_plan_id,
      'Essentials',
      2,
      1,
      4,
      1200,
      'Client reimburses crew lodging at actual cost unless separately approved.',
      'Client reimburses commercial travel and positioning expenses at actual cost.',
      'Standard',
      2500,
      27000,
      10
    );
  end if;

  v_plan_id := null;
  select id into v_plan_id
  from public.subscription_plans
  where name = 'Managed Mission Support'
  limit 1;

  if v_plan_id is null then
    insert into public.subscription_plans (
      name,
      aircraft_category,
      description,
      status,
      billing_cadence_supported,
      base_admin_fee_monthly,
      base_admin_fee_annual,
      annual_discount_percent,
      default_terms
    )
    values (
      'Managed Mission Support',
      'Light, midsize, and super-midsize jet',
      'Priority AMG support for recurring owner missions, crew coordination, maintenance repositioning, and client portal reporting.',
      'active',
      array['monthly', 'annual'],
      6500,
      70200,
      10,
      'Template pricing and allowances require AMG approval before becoming a binding service commitment.'
    )
    returning id into v_plan_id;
  end if;

  if not exists (
    select 1 from public.subscription_plan_tiers
    where plan_id = v_plan_id and name = 'Priority'
  ) then
    insert into public.subscription_plan_tiers (
      plan_id,
      name,
      included_flights,
      included_mx_repositions,
      included_admin_hours,
      crew_day_rate,
      lodging_policy,
      travel_policy,
      priority_level,
      monthly_price,
      annual_price,
      sort_order
    )
    values (
      v_plan_id,
      'Priority',
      6,
      2,
      12,
      1500,
      'Client reimburses crew lodging at actual cost unless a mission quote states otherwise.',
      'Client reimburses commercial travel, ground transportation, and positioning expenses at actual cost.',
      'Priority',
      6500,
      70200,
      20
    );
  end if;

  v_plan_id := null;
  select id into v_plan_id
  from public.subscription_plans
  where name = 'Fleet Operations Partner'
  limit 1;

  if v_plan_id is null then
    insert into public.subscription_plans (
      name,
      aircraft_category,
      description,
      status,
      billing_cadence_supported,
      base_admin_fee_monthly,
      base_admin_fee_annual,
      annual_discount_percent,
      default_terms
    )
    values (
      'Fleet Operations Partner',
      'Multi-aircraft owner and managed fleet',
      'Expanded AMG operations support for multi-aircraft owners, recurring trip activity, vendor coordination, documents, and reporting.',
      'active',
      array['monthly', 'annual'],
      12000,
      129600,
      10,
      'Template pricing and allowances require AMG approval before becoming a binding service commitment.'
    )
    returning id into v_plan_id;
  end if;

  if not exists (
    select 1 from public.subscription_plan_tiers
    where plan_id = v_plan_id and name = 'Fleet'
  ) then
    insert into public.subscription_plan_tiers (
      plan_id,
      name,
      included_flights,
      included_mx_repositions,
      included_admin_hours,
      crew_day_rate,
      lodging_policy,
      travel_policy,
      priority_level,
      monthly_price,
      annual_price,
      sort_order
    )
    values (
      v_plan_id,
      'Fleet',
      12,
      4,
      24,
      1750,
      'Client reimburses crew lodging at actual cost unless a fleet agreement states otherwise.',
      'Client reimburses commercial travel, ground transportation, and aircraft positioning expenses at actual cost.',
      'Highest',
      12000,
      129600,
      30
    );
  end if;
end $$;
