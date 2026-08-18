-- MindSpace for Business — Employee accounts, assessments, and booking
--
-- Run this once in your Supabase project's SQL editor (Project -> SQL Editor -> New query).
-- It only adds tables; it does not touch `anonymous_checkins`, which stays exactly as is.
--
-- Anonymity contract this schema enforces:
--   * `profiles`, `assessment_records`, `therapy_bookings` are all row-level-security
--     locked to the owning user (auth.uid() = user_id). No role reads another
--     person's row — not HR, not the anon key, nobody but the employee themselves.
--   * The ONLY thing HR's dashboard is ever allowed to read is `org_employee_stats()`,
--     a function that returns three counts for the whole org. It never returns a row,
--     a name, or an email.

create extension if not exists pgcrypto;

-- ── profiles ─────────────────────────────────────────────────────────────────
-- One row per signed-in employee. Holds their own display info only; never
-- exposed to HR in any form.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  org_id text not null default 'demo-acme',
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Employees manage their own profile" on public.profiles
  for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ── assessment_records ──────────────────────────────────────────────────────
-- Every assessment an employee takes, unlimited. Only they can ever read their
-- own history back.
create table if not exists public.assessment_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  org_id text not null default 'demo-acme',
  domain text not null,
  score numeric not null,
  max_score numeric not null,
  level text not null,
  items jsonb not null default '[]'::jsonb,
  submitted_at timestamptz not null default now()
);

alter table public.assessment_records enable row level security;

create policy "Employees manage their own assessment records" on public.assessment_records
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── therapy_bookings ─────────────────────────────────────────────────────────
-- A booking *request* — this demo does not process payment. `status` tracks
-- confirmation state ('requested' | 'confirmed' | 'cancelled').
create table if not exists public.therapy_bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  org_id text not null default 'demo-acme',
  session_format text not null check (session_format in ('group', '1:1')),
  preferred_slot timestamptz,
  status text not null default 'requested' check (status in ('requested', 'confirmed', 'cancelled')),
  notes text not null default '',
  created_at timestamptz not null default now()
);

alter table public.therapy_bookings enable row level security;

create policy "Employees manage their own bookings" on public.therapy_bookings
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── org_employee_stats() ─────────────────────────────────────────────────────
-- The one and only door HR's dashboard gets into this data: three counts for
-- the org, nothing else. security definer lets it read across RLS internally;
-- it is granted to anon because the HR console currently authenticates locally
-- (not via Supabase auth) and uses the same anon key as the rest of the app —
-- the safety comes from this function never returning a row, only counts.
create or replace function public.org_employee_stats(p_org_id text)
returns table (total_signups int, total_assessments int, total_bookings int)
language sql
security definer
set search_path = public
as $$
  select
    (select count(*)::int from public.profiles where org_id = p_org_id),
    (select count(*)::int from public.assessment_records where org_id = p_org_id),
    (select count(*)::int from public.therapy_bookings where org_id = p_org_id);
$$;

grant execute on function public.org_employee_stats(text) to anon, authenticated;
