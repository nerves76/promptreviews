-- Create businesses table
create table if not exists public.businesses (
  id uuid references auth.users on delete cascade not null primary key,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.businesses enable row level security;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own business profile" ON public.businesses;
DROP POLICY IF EXISTS "Users can update their own business profile" ON public.businesses;
DROP POLICY IF EXISTS "Users can create their own business profile" ON public.businesses;

-- Create policies
create policy "Users can view their own business profile"
  on public.businesses for select
  using (auth.uid() = id);

create policy "Users can update their own business profile"
  on public.businesses for update
  using (auth.uid() = id);

create policy "Users can create their own business profile"
  on public.businesses for insert
  with check (auth.uid() = id);

-- Create function to handle updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS handle_businesses_updated_at ON public.businesses;

-- Create trigger for updated_at
create trigger handle_businesses_updated_at
  before update on public.businesses
  for each row
  execute procedure public.handle_updated_at(); 