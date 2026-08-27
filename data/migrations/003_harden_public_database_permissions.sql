-- ============================================================
-- 003 — Harden public database permissions
--
-- The browser uses the Supabase anon key, so public dashboard
-- tables must be explicitly read-only.
--
-- The USSD API uses the service-role key and therefore does not
-- depend on anon permissions for its writes.
-- ============================================================

-- Public dashboard data: read-only for anonymous users.
grant select on public.outbreaks to anon;
grant select on public.locations to anon;
grant select on public.alerts to anon;
grant select on public.cases to anon;

-- Anonymous users must not be able to modify dashboard data.
revoke insert, update, delete, truncate
  on public.outbreaks from anon;

revoke insert, update, delete, truncate
  on public.locations from anon;

revoke insert, update, delete, truncate
  on public.alerts from anon;

revoke insert, update, delete, truncate
  on public.cases from anon;

-- Protected application tables must not be accessible by anon.
revoke all on public.profiles from anon;
revoke all on public.ussd_reports from anon;
revoke all on public.ussd_sessions from anon;

-- Authenticated users do not receive write access merely by
-- being authenticated. Protected writes should occur through
-- explicitly authorized server-side flows/policies.
revoke insert, update, delete, truncate
  on public.outbreaks from authenticated;

revoke insert, update, delete, truncate
  on public.locations from authenticated;

revoke insert, update, delete, truncate
  on public.alerts from authenticated;

revoke insert, update, delete, truncate
  on public.cases from authenticated;