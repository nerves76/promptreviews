-- Migration: Add rate_limit_violations table and atomic increment function
-- This migration adds:
-- 1. rate_limit_violations table for logging rate limit breaches
-- 2. check_and_increment_rate_limit function for atomic counter updates (prevents race conditions)

-- Create rate_limit_violations table for monitoring
create table if not exists public.rate_limit_violations (
  id uuid primary key default gen_random_uuid(),
  rate_limit_key text not null,
  user_id uuid references auth.users(id) on delete set null,
  account_id uuid references public.accounts(id) on delete set null,
  endpoint text not null,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

-- Add index for efficient querying by time and key
create index if not exists idx_rate_limit_violations_created_at
  on public.rate_limit_violations(created_at desc);
create index if not exists idx_rate_limit_violations_key
  on public.rate_limit_violations(rate_limit_key);

-- Enable RLS
alter table public.rate_limit_violations enable row level security;

-- Only service role can manage violations
create policy "service role can manage rate_limit_violations"
  on public.rate_limit_violations
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Create atomic rate limit check and increment function
-- This prevents race conditions by using row-level locking
create or replace function public.check_and_increment_rate_limit(
  p_key text,
  p_max_requests integer,
  p_window_ms bigint
)
returns table(
  allowed boolean,
  current_count integer,
  reset_time timestamptz
)
language plpgsql
security definer
as $$
declare
  v_now timestamptz := now();
  v_reset_at timestamptz := v_now + (p_window_ms || ' milliseconds')::interval;
  v_existing record;
  v_new_count integer;
begin
  -- Try to get existing entry with row lock
  select rc.count, rc.reset_time into v_existing
  from public.rate_limit_counters rc
  where rc.key = p_key
  for update;

  -- If no entry exists or window has expired, create/reset
  if not found or v_existing.reset_time <= v_now then
    insert into public.rate_limit_counters (key, count, reset_time)
    values (p_key, 1, v_reset_at)
    on conflict (key) do update set
      count = 1,
      reset_time = v_reset_at;

    return query select true, 1, v_reset_at;
    return;
  end if;

  -- Check if already at limit
  if v_existing.count >= p_max_requests then
    return query select false, v_existing.count, v_existing.reset_time;
    return;
  end if;

  -- Increment counter atomically
  v_new_count := v_existing.count + 1;

  update public.rate_limit_counters
  set count = v_new_count
  where key = p_key;

  return query select true, v_new_count, v_existing.reset_time;
end;
$$;

-- Grant execute permission to service role
grant execute on function public.check_and_increment_rate_limit(text, integer, bigint) to service_role;
