-- ============================================================
-- 002 — Keep the USSD audit log out of public reach
--
-- `ussd_reports` holds the reporter's phone number, which is what a
-- field officer needs in order to follow up. That is a legitimate
-- reason to store it and not a reason to publish it.
--
-- The dashboard reads Supabase from the browser with the anon key,
-- which is public by design. Without row level security, anyone can
-- call the REST endpoint directly and read every phone number,
-- whatever the UI chooses to render. This migration closes that.
--
-- After running, the SORMAS panel only lists reports for a signed-in
-- user. The USSD webhook keeps working: app/api/ussd/route.ts writes
-- server-side, and the service role bypasses RLS.
-- ============================================================

begin;

alter table ussd_reports  enable row level security;
alter table ussd_sessions enable row level security;

-- Remove any permissive policy left from initial setup.
drop policy if exists "ussd_reports are viewable by everyone"  on ussd_reports;
drop policy if exists "Enable read access for all users"       on ussd_reports;
drop policy if exists "ussd_sessions are viewable by everyone" on ussd_sessions;
drop policy if exists "Enable read access for all users"       on ussd_sessions;

-- Only signed-in users (surveillance officers) may read the audit log.
drop policy if exists "authenticated read ussd_reports" on ussd_reports;
create policy "authenticated read ussd_reports"
  on ussd_reports for select
  to authenticated
  using (true);

drop policy if exists "authenticated update ussd_reports" on ussd_reports;
create policy "authenticated update ussd_reports"
  on ussd_reports for update
  to authenticated
  using (true)
  with check (true);

-- Sessions are working state for the USSD handler only; nobody reads
-- them from the browser, so no select policy is granted.

commit;

-- Verify from an unauthenticated client — this must return no rows:
--   select id, phone_number from ussd_reports limit 1;
