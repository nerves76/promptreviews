-- Durable rate limiter backing table
create table if not exists public.rate_limit_counters (
  key text primary key,
  count integer not null default 0,
  reset_time timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger handle_rate_limit_counter_updated_at
  before update on public.rate_limit_counters
  for each row
  execute function public.handle_updated_at();

alter table public.rate_limit_counters enable row level security;

create policy "service role can manage rate_limit_counters"
  on public.rate_limit_counters
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
