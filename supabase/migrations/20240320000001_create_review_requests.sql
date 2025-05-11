-- Create review_requests table
create table if not exists public.review_requests (
  id uuid default gen_random_uuid() primary key,
  business_id uuid references public.businesses on delete cascade not null,
  title text not null,
  client_name text not null,
  project_type text not null,
  outcomes text not null,
  review_platform_links jsonb not null default '[]'::jsonb,
  custom_incentive text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.review_requests enable row level security;

-- Create policies
create policy "Users can view their own review requests"
  on public.review_requests for select
  using (auth.uid() = business_id);

create policy "Users can create their own review requests"
  on public.review_requests for insert
  with check (auth.uid() = business_id);

create policy "Users can update their own review requests"
  on public.review_requests for update
  using (auth.uid() = business_id);

create policy "Users can delete their own review requests"
  on public.review_requests for delete
  using (auth.uid() = business_id);

-- Create trigger for updated_at
create trigger handle_review_requests_updated_at
  before update on public.review_requests
  for each row
  execute procedure public.handle_updated_at(); 