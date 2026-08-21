-- MindSpace for Business — real-assessment aggregates for the Feelings /
-- Pressures / Actions pages (the legacy anonymous-checkin pipeline these
-- pages used to run on is being retired in favour of the real employee
-- assessment flow).
--
-- Run this once in your Supabase project's SQL editor, after
-- schema-employee.sql and schema-employee-analytics.sql. It only adds
-- functions; it does not touch any table.
--
-- Same anonymity contract as the rest of this schema: security definer lets
-- these read across RLS internally, and every function only ever returns
-- counts/means grouped by domain, tier, or item — never a row, never a
-- person. All three dedupe to each employee's LATEST submission per domain
-- first, so someone retaking an assessment five times doesn't get counted
-- five times.

-- ── org_mood_tiers() ────────────────────────────────────────────────────────
-- Classifies each employee into one of the four mood tiers (same thresholds
-- as domain/snapshot.ts's tierForCheckIn: 2+ High domains or 80%+ severity on
-- any one domain reads as struggling, and so on), then returns org-wide
-- counts per tier. Unmasked, like org_employee_stats — a tier count for the
-- whole org can't identify anyone.
create or replace function public.org_mood_tiers(p_org_id text)
returns table (tier text, n int)
language sql
security definer
set search_path = public
as $$
  with latest as (
    select distinct on (user_id, domain) user_id, level, score, max_score
    from public.assessment_records
    where org_id = p_org_id
    order by user_id, domain, submitted_at desc
  ),
  per_user as (
    select
      user_id,
      count(*) filter (where level = 'High') as high_count,
      count(*) filter (where level = 'Moderate') as moderate_count,
      max((score / nullif(max_score, 0)) * 100) as worst_pct
    from latest
    group by user_id
  ),
  classified as (
    select
      case
        when high_count >= 2 or worst_pct >= 80 then 'struggling'
        when high_count = 1 or moderate_count >= 2 then 'strained'
        when moderate_count = 1 then 'steady'
        when worst_pct <= 35 then 'thriving'
        else 'steady'
      end as tier
    from per_user
  )
  select tier, count(*)::int as n
  from classified
  group by tier;
$$;

grant execute on function public.org_mood_tiers(text) to anon, authenticated;

-- ── org_domain_severity() ───────────────────────────────────────────────────
-- Mean severity (0-100) per domain, from each employee's latest result only.
-- A domain with fewer than p_k people who've taken it is left out of the
-- result entirely, not returned as an unreliable mean.
drop function if exists public.org_domain_severity(text, int);

create or replace function public.org_domain_severity(p_org_id text, p_k int default 5)
returns table (domain text, mean_pct numeric, n int)
language sql
security definer
set search_path = public
as $$
  with latest as (
    select distinct on (user_id, domain) domain, score, max_score
    from public.assessment_records
    where org_id = p_org_id
    order by user_id, domain, submitted_at desc
  )
  select domain, avg((score / nullif(max_score, 0)) * 100) as mean_pct, count(*)::int as n
  from latest
  group by domain
  having count(*) >= p_k;
$$;

grant execute on function public.org_domain_severity(text, int) to anon, authenticated;

-- ── org_toughest_items() ────────────────────────────────────────────────────
-- The individual questions people scored worst on, across every domain,
-- from each employee's latest result only. An item fewer than p_k people
-- answered is excluded, same rule as everywhere else.
drop function if exists public.org_toughest_items(text, int);

create or replace function public.org_toughest_items(p_org_id text, p_k int default 5)
returns table (domain text, qid int, mean_score numeric, n int)
language sql
security definer
set search_path = public
as $$
  with latest as (
    select distinct on (user_id, domain) domain, items
    from public.assessment_records
    where org_id = p_org_id
    order by user_id, domain, submitted_at desc
  ),
  unnested as (
    select
      l.domain,
      (item->>'qid')::int as qid,
      (item->>'score')::numeric as score
    from latest l,
      jsonb_array_elements(l.items) as item
  )
  select domain, qid, avg(score) as mean_score, count(*)::int as n
  from unnested
  group by domain, qid
  having count(*) >= p_k
  order by avg(score) desc
  limit 10;
$$;

grant execute on function public.org_toughest_items(text, int) to anon, authenticated;
