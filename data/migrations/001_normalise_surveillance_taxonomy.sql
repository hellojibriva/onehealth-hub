-- ============================================================
-- 001 — Normalise the surveillance taxonomy and remove reporter PII
--
-- Run in the Supabase SQL editor. Every statement is idempotent.
--
-- Why this exists
-- ---------------
-- The application now normalises names and masks reporters on read
-- (lib/taxonomy.ts), so the site is correct without this script.
-- But `outbreaks` is readable through the public anon key, so the
-- phone numbers stored in it remain retrievable directly from the
-- REST API regardless of what the UI displays. Only deleting the
-- values from the database actually removes that exposure.
--
-- Take a backup before running. The PII scrub is not reversible —
-- that is the point.
-- ============================================================

begin;

-- ------------------------------------------------------------
-- 1. Remove reporter phone numbers from the public outbreaks table.
--    The numbers remain in `ussd_reports`, the audit log an officer
--    needs for follow-up, which migration 002 locks down.
-- ------------------------------------------------------------

update outbreaks
set    description = regexp_replace(
         description,
         'Reported via USSD by\s+\+?[0-9][0-9 \-]*',
         'Reported via USSD · Community reporter',
         'gi'
       )
where  description ~* 'Reported via USSD by';

-- Safety net for any other phone-shaped token in free text.
update outbreaks
set    description = regexp_replace(
         description,
         '(\+?234[ \-]?[0-9][0-9 \-]{7,}[0-9]|\m0[0-9]{10}\M)',
         '[reporter contact withheld]',
         'g'
       )
where  description ~ '(\+?234[ \-]?[0-9][0-9 \-]{7,}[0-9]|\m0[0-9]{10}\M)';

update outbreaks
set    reported_by = null
where  report_source = 'COMMUNITY'
   or  reported_by ~ '(\+?234[ \-]?[0-9][0-9 \-]{7,}[0-9]|\m0[0-9]{10}\M)';

-- ------------------------------------------------------------
-- 2. One spelling per disease.
--    "Bruscellosis" and the three Lassa variants were the recurring
--    offenders; the rest are folded in so the vocabulary matches
--    CANONICAL_DISEASES in lib/taxonomy.ts.
-- ------------------------------------------------------------

update outbreaks set disease_name = 'Brucellosis'
where  lower(btrim(disease_name)) in ('bruscellosis', 'brucelosis', 'brucella', 'brucellosis');

update outbreaks set disease_name = 'Lassa Fever'
where  lower(btrim(disease_name)) in ('lassa', 'lassa fever', 'lassa fevee', 'lassa fevr');

update outbreaks set disease_name = 'Avian Influenza (H5N1)'
where  lower(btrim(disease_name)) in ('avian influenza', 'avian influenza h5n1', 'h5n1', 'bird flu');

update outbreaks set disease_name = 'Meningitis (CSM)'
where  lower(btrim(disease_name)) in ('meningitis', 'csm', 'cerebrospinal meningitis');

update outbreaks set disease_name = 'Mpox'
where  lower(btrim(disease_name)) in ('mpox', 'monkeypox');

update outbreaks set disease_name = initcap(btrim(disease_name))
where  lower(btrim(disease_name)) in ('cholera', 'rabies', 'anthrax', 'malaria');

-- Also normalise the alert vocabulary so RCCE and the map agree.
update rcce_alerts set disease = 'Brucellosis'
where  lower(btrim(disease)) in ('bruscellosis', 'brucelosis');

update rcce_alerts set disease = 'Lassa Fever'
where  lower(btrim(disease)) in ('lassa', 'lassa fever', 'lassa fevee', 'lassa fevr');

-- ------------------------------------------------------------
-- 3. Community signals are signs, not diagnoses.
--    Free-text syndromic entries are moved onto the
--    "Community-reported: <sign>" convention, which is what the
--    application reads to classify a record as a signal rather than
--    a disease. "Zawo da Amai" is Hausa for diarrhoea and vomiting.
-- ------------------------------------------------------------

update outbreaks set disease_name = 'Community-reported: Diarrhea/vomiting'
where  lower(btrim(disease_name)) in ('zawo da amai', 'runny stomach', 'diarrhoea/vomiting');

update outbreaks set disease_name = 'Community-reported: Fever and vomiting'
where  lower(btrim(disease_name)) in ('fever and vomitting', 'fever and vomiting');

-- Fix the "Diarrhea"/"Diarrhoea" split inside the existing prefix values.
update outbreaks set disease_name = 'Community-reported: Diarrhea/vomiting'
where  lower(btrim(disease_name)) = 'community-reported: diarrhoea/vomiting';

-- ------------------------------------------------------------
-- 4. One written form per place, and a zone for every location.
-- ------------------------------------------------------------

update locations
set    state = btrim(regexp_replace(state, '\s+state$', '', 'i'))
where  state ~* '\s+state$';

update locations set state = 'FCT'
where  lower(btrim(state)) in ('abuja', 'fct abuja', 'abuja fct', 'federal capital territory');

update locations
set    geopolitical_zone = case
  when lower(state) in ('fct','nasarawa','niger','benue','kogi','kwara','plateau')                  then 'North Central'
  when lower(state) in ('kano','kaduna','katsina','kebbi','sokoto','zamfara','jigawa')              then 'North West'
  when lower(state) in ('borno','yobe','adamawa','taraba','bauchi','gombe')                         then 'North East'
  when lower(state) in ('lagos','ogun','oyo','osun','ondo','ekiti')                                 then 'South West'
  when lower(state) in ('anambra','enugu','imo','abia','ebonyi')                                    then 'South East'
  when lower(state) in ('rivers','delta','edo','bayelsa','cross river','akwa ibom')                 then 'South South'
  else geopolitical_zone
end
where  geopolitical_zone is null or btrim(geopolitical_zone) = '' or geopolitical_zone is distinct from geopolitical_zone;

-- ------------------------------------------------------------
-- 5. Settlements wrongly recorded as LGAs.
--
--    The USSD prompt asks for "your LGA or town" and the handler wrote the
--    answer into both `name` and `lga`, so a settlement became a reporting
--    unit of its own. Doko is a town in Garki LGA, Jigawa — not an LGA.
--    The handler no longer does this; these are the rows it already created.
-- ------------------------------------------------------------

update locations set lga = 'Garki'
where  state = 'Jigawa' and name = 'Doko' and lga = 'Doko';

-- Review the rest before deciding — each needs local knowledge, so nothing
-- is guessed here:
--   select id, state, lga, name from locations where lower(lga) = lower(name);

commit;

-- ============================================================
-- OPTIONAL — merge duplicate location rows
--
-- `Nasarawa State / Lafia` exists twice, which splits one place
-- across two map markers and two choropleth counts. Review the
-- SELECT before running the merge; it repoints outbreaks onto the
-- oldest matching row and deletes the redundant ones.
-- ============================================================

-- Inspect first:
--   select state, lga, name, count(*), array_agg(id)
--   from locations group by 1,2,3 having count(*) > 1;

-- begin;
--   with ranked as (
--     select id,
--            first_value(id) over (partition by lower(state), lower(coalesce(lga,'')), lower(name)
--                                  order by id) as keep_id
--     from locations
--   )
--   update outbreaks o set location_id = r.keep_id
--   from ranked r where o.location_id = r.id and r.id <> r.keep_id;
--
--   delete from locations l
--   where exists (
--     select 1 from locations k
--     where lower(k.state) = lower(l.state)
--       and lower(coalesce(k.lga,'')) = lower(coalesce(l.lga,''))
--       and lower(k.name) = lower(l.name)
--       and k.id < l.id
--   );
-- commit;
