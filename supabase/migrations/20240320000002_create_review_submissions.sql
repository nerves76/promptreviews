-- Create review_submissions table
create table if not exists public.review_submissions (
  id uuid default gen_random_uuid() primary key,
  review_request_id uuid references public.review_requests on delete cascade not null,
  platform text not null,
  submitted_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create index for faster lookups
create index if not exists review_submissions_review_request_id_idx on public.review_submissions(review_request_id);

-- Enable RLS
alter table public.review_submissions enable row level security;

-- Create policies
create policy "Users can view submissions for their review requests"
  on public.review_submissions for select
  using (
    exists (
      select 1 from public.review_requests
      where review_requests.id = review_submissions.review_request_id
      and review_requests.business_id = auth.uid()
    )
  );

create policy "Anyone can create submissions"
  on public.review_submissions for insert
  with check (true); 