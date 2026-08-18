-- MindSpace for Business — HR dashboard aggregate breakdowns
--
-- Run this once in your Supabase project's SQL editor, after schema-employee.sql.
-- It only adds functions; it does not touch any table or its RLS policies.
--
-- Same anonymity contract as org_employee_stats() in schema-employee.sql:
--   * security definer lets these functions read across RLS internally.
--   * They never return a row — only counts, grouped at most by domain/level or
--     format/status. Any group with fewer than p_k people is withheld entirely
--     (the count never leaves the database), not just masked in the UI.

-- ── org_assessment_breakdown() ──────────────────────────────────────────────
-- Counts of assessment_records grouped by domain and severity level. The
-- per-domain TOTAL is never withheld (a raw headcount, same as
-- org_employee_stats() already shows) — only the low/moderate/high SEVERITY
-- SPLIT is withheld when fewer than p_k people have taken that domain, since
-- that split is what could start to say something about a specific person.
drop function if exists public.org_assessment_breakdown(text, int);

create or replace function public.org_assessment_breakdown(p_org_id text, p_k int default 5)
returns table (domain text, total int, level text, n int, level_masked boolean)
language sql
security definer
set search_path = public
as $$
  with totals as (
    select ar.domain, count(*)::int as total
    from public.assessment_records ar
    where ar.org_id = p_org_id
    group by ar.domain
  ),
  by_level as (
    select ar.domain, ar.level, count(*)::int as n
    from public.assessment_records ar
    where ar.org_id = p_org_id
    group by ar.domain, ar.level
  )
  select t.domain, t.total, null::text as level, null::int as n, true as level_masked
  from totals t
  where t.total < p_k
  union all
  select bl.domain, t.total, bl.level, bl.n, false as level_masked
  from by_level bl
  join totals t on t.domain = bl.domain
  where t.total >= p_k;
$$;

grant execute on function public.org_assessment_breakdown(text, int) to anon, authenticated;

-- ── org_booking_breakdown() ──────────────────────────────────────────────────
-- Counts of therapy_bookings grouped by session format and status. Same
-- rule as above: the per-format TOTAL is always shown; only the
-- requested/confirmed/cancelled STATUS SPLIT is withheld below p_k.
drop function if exists public.org_booking_breakdown(text, int);

create or replace function public.org_booking_breakdown(p_org_id text, p_k int default 5)
returns table (session_format text, total int, status text, n int, status_masked boolean)
language sql
security definer
set search_path = public
as $$
  with totals as (
    select tb.session_format, count(*)::int as total
    from public.therapy_bookings tb
    where tb.org_id = p_org_id
    group by tb.session_format
  ),
  by_status as (
    select tb.session_format, tb.status, count(*)::int as n
    from public.therapy_bookings tb
    where tb.org_id = p_org_id
    group by tb.session_format, tb.status
  )
  select t.session_format, t.total, null::text as status, null::int as n, true as status_masked
  from totals t
  where t.total < p_k
  union all
  select bs.session_format, t.total, bs.status, bs.n, false as status_masked
  from by_status bs
  join totals t on t.session_format = bs.session_format
  where t.total >= p_k;
$$;

grant execute on function public.org_booking_breakdown(text, int) to anon, authenticated;

-- ── org_weekly_trend() ────────────────────────────────────────────────────────
-- Org-wide weekly counts of sign-ups, assessments and bookings for the last
-- p_weeks weeks. Unmasked — same privacy grain as org_employee_stats()'s
-- all-time totals, just cut by week instead of all time.
drop function if exists public.org_weekly_trend(text, int);

create or replace function public.org_weekly_trend(p_org_id text, p_weeks int default 8)
returns table (week_start date, signups int, assessments int, bookings int)
language sql
security definer
set search_path = public
as $$
  with weeks as (
    select generate_series(
      date_trunc('week', now()) - ((p_weeks - 1) * interval '1 week'),
      date_trunc('week', now()),
      interval '1 week'
    )::date as week_start
  )
  select
    w.week_start,
    (select count(*)::int from public.profiles p
      where p.org_id = p_org_id
        and date_trunc('week', p.created_at)::date = w.week_start),
    (select count(*)::int from public.assessment_records ar
      where ar.org_id = p_org_id
        and date_trunc('week', ar.submitted_at)::date = w.week_start),
    (select count(*)::int from public.therapy_bookings tb
      where tb.org_id = p_org_id
        and date_trunc('week', tb.created_at)::date = w.week_start)
  from weeks w
  order by w.week_start;
$$;

grant execute on function public.org_weekly_trend(text, int) to anon, authenticated;
