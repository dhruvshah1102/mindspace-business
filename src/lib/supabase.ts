import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('your-project')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;

/**
 * SQL Schema for Supabase:
 *
 * ```sql
 * -- 1. Create table
 * create table if not exists public.anonymous_checkins (
 *   id text primary key,
 *   org_id text not null default 'demo-acme',
 *   submitted_at timestamptz not null default now(),
 *   team text not null default 'Prefer not to say',
 *   work_pattern text not null default 'Prefer not to say',
 *   tenure_band text not null default 'Prefer not to say',
 *   domains jsonb not null default '[]'::jsonb,
 *   feelings jsonb not null default '[]'::jsonb,
 *   note text not null default ''
 * );
 *
 * -- 2. Enable Row Level Security (RLS)
 * alter table public.anonymous_checkins enable row level security;
 *
 * -- 3. Allow anonymous inserts from employees
 * create policy "Allow anonymous inserts" on public.anonymous_checkins
 *   for insert with check (true);
 *
 * -- 4. Allow reading aggregates for report generation
 * create policy "Allow read for aggregates" on public.anonymous_checkins
 *   for select using (true);
 * ```
 */
