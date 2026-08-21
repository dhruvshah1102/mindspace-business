-- MindSpace for Business — daily mood pulse (the "How are you feeling right
-- now?" picker on the employee Hub)
--
-- Run this once in your Supabase project's SQL editor, after
-- schema-employee.sql. It only adds a table and functions.
--
-- Same anonymity contract as the rest of this schema:
--   * `daily_mood_checkins` is row-level-security locked to the owning user
--     (auth.uid() = user_id). HR never reads a row from it directly.
--   * HR's dashboard only ever reads security definer functions that return
--     counts: today's total check-ins (always shown, like org_employee_stats),
--     and the mood breakdown (withheld entirely — zero rows, not an
--     approximation — until at least p_k people have checked in today).

create extension if not exists pgcrypto;

-- ── daily_mood_checkins ──────────────────────────────────────────────────────
-- One row per employee per calendar day. Picking a different mood the same
-- day updates the existing row rather than adding a second one, so a daily
-- aggregate never double-counts a person who changed their mind.
create table if not exists public.daily_mood_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  org_id text not null default 'demo-acme',
  mood text not null check (mood in ('energized', 'calm', 'okay', 'stressed', 'overwhelmed')),
  checkin_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, checkin_date)
);

alter table public.daily_mood_checkins enable row level security;

drop policy if exists "Employees manage their own mood check-ins" on public.daily_mood_checkins;
create policy "Employees manage their own mood check-ins" on public.daily_mood_checkins
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── org_daily_checkin_stats() ────────────────────────────────────────────────
-- How many employees have shared a mood today (or any given date). A raw
-- headcount, never withheld — same rule as org_employee_stats.
create or replace function public.org_daily_checkin_stats(p_org_id text, p_date date default current_date)
returns table (total int)
language sql
security definer
set search_path = public
as $$
  select count(*)::int
  from public.daily_mood_checkins
  where org_id = p_org_id and checkin_date = p_date;
$$;

grant execute on function public.org_daily_checkin_stats(text, date) to anon, authenticated;

-- ── org_daily_mood_summary() ─────────────────────────────────────────────────
-- Counts by mood for a given date. Returns no rows at all — not a zero, not
-- an approximation — while fewer than p_k people have checked in that day,
-- so a small day's mood mix can never be reverse-engineered to a person.
drop function if exists public.org_daily_mood_summary(text, date, int);

create or replace function public.org_daily_mood_summary(p_org_id text, p_date date default current_date, p_k int default 5)
returns table (mood text, n int)
language sql
security definer
set search_path = public
as $$
  with totals as (
    select count(*)::int as total
    from public.daily_mood_checkins
    where org_id = p_org_id and checkin_date = p_date
  )
  select mc.mood, count(*)::int as n
  from public.daily_mood_checkins mc, totals t
  where mc.org_id = p_org_id and mc.checkin_date = p_date and t.total >= p_k
  group by mc.mood;
$$;

grant execute on function public.org_daily_mood_summary(text, date, int) to anon, authenticated;
