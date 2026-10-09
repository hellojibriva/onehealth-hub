-- ============================================================
-- 004 — Restore public read access for the dashboard
--
-- Run in the Supabase SQL editor. Every statement is idempotent.
--
-- Why this exists
-- ---------------
-- The dashboard reads Supabase from the browser with the anon key.
-- Migration 003 grants SELECT to anon, but a grant alone is not
-- enough once row level security is switched on for a table (for
-- example from the Supabase security advisor): with RLS enabled and
-- no SELECT policy, every read succeeds with zero rows, and the
-- dashboard renders blank without reporting any error.
--
-- This migration adds explicit read-only policies for the public
-- dashboard tables. A policy is inert on a table without RLS, so
-- this is safe whichever state each table is in. It grants no write
-- access and does not touch the protected tables from 002/003.
-- ============================================================

-- ------------------------------------------------------------
-- Diagnose first (optional). Shows, per table, whether RLS is on
-- and how many SELECT policies exist. "rls on, 0 policies" is the
-- blank-dashboard state.
--
--   select c.relname as table_name,
--          c.relrowsecurity as rls_enabled,
--          count(p.polname) filter (where p.polcmd in ('r', '*')) as select_policies,
--          has_table_privilege('anon', c.oid, 'select') as anon_can_select
--   from pg_class c
--   join pg_namespace n on n.oid = c.relnamespace and n.nspname = 'public'
--   left join pg_policy p on p.polrelid = c.oid
--   where c.relname in ('outbreaks','locations','alerts','cases','rcce_alerts','lab_results')
--   group by c.relname, c.relrowsecurity, c.oid
--   order by 1;
--
-- And confirm the data is actually there:
--   select count(*) from outbreaks;
-- ------------------------------------------------------------

begin;

grant usage on schema public to anon, authenticated;

grant select on public.outbreaks   to anon, authenticated;
grant select on public.locations   to anon, authenticated;
grant select on public.alerts      to anon, authenticated;
grant select on public.cases       to anon, authenticated;
grant select on public.rcce_alerts to anon, authenticated;
grant select on public.lab_results to anon, authenticated;

drop policy if exists "public read outbreaks" on public.outbreaks;
create policy "public read outbreaks"
  on public.outbreaks for select
  to anon, authenticated
  using (true);

drop policy if exists "public read locations" on public.locations;
create policy "public read locations"
  on public.locations for select
  to anon, authenticated
  using (true);

drop policy if exists "public read alerts" on public.alerts;
create policy "public read alerts"
  on public.alerts for select
  to anon, authenticated
  using (true);

drop policy if exists "public read cases" on public.cases;
create policy "public read cases"
  on public.cases for select
  to anon, authenticated
  using (true);

drop policy if exists "public read rcce_alerts" on public.rcce_alerts;
create policy "public read rcce_alerts"
  on public.rcce_alerts for select
  to anon, authenticated
  using (true);

drop policy if exists "public read lab_results" on public.lab_results;
create policy "public read lab_results"
  on public.lab_results for select
  to anon, authenticated
  using (true);

commit;

-- Verify as the browser does: Supabase dashboard → SQL editor,
-- switch the role selector to "anon", then run
--   select count(*) from outbreaks;
-- It must return the same count as when run as postgres.
