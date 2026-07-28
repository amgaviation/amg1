-- Raise the outreach daily send cap to 150.
--
-- Requested explicitly by the account owner after being shown the tradeoff: the
-- cap existed at 25 as a deliverability guard, and cold outreach shares a
-- sending domain with portal and billing mail, so a reputation hit reaches
-- invoices and password resets too. That call is the owner's to make; this
-- records it in the schema rather than leaving it as an undocumented click.
--
-- Everything else stays as-is: the kill switch still ships off, the templates
-- still need approving, and the send window is still 09:00-19:00 in
-- send_timezone. The cap is a ceiling, not a target -- it bounds a rolling 24h
-- window, and is lowered again from Admin - Settings - Lead Outreach.

update public.outreach_settings
set daily_send_cap = 150,
    updated_at = now()
where id = true;
