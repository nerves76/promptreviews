-- Debug why business_id isn't getting populated

DO $$
DECLARE
  total_gbp INTEGER;
  with_prompt_page INTEGER;
  prompt_pages_with_account INTEGER;
  accounts_with_business INTEGER;
  successful_joins INTEGER;
BEGIN
  -- Total Google Business Profile reviews
  SELECT COUNT(*) INTO total_gbp
  FROM public.review_submissions
  WHERE platform = 'Google Business Profile';

  -- How many have prompt_page_id
  SELECT COUNT(*) INTO with_prompt_page
  FROM public.review_submissions
  WHERE platform = 'Google Business Profile'
  AND prompt_page_id IS NOT NULL;

  -- How many prompt pages have account_id
  SELECT COUNT(DISTINCT pp.id) INTO prompt_pages_with_account
  FROM public.review_submissions rs
  JOIN public.prompt_pages pp ON rs.prompt_page_id = pp.id
  WHERE rs.platform = 'Google Business Profile'
  AND pp.account_id IS NOT NULL;

  -- How many of those accounts have a business record
  SELECT COUNT(DISTINCT b.id) INTO accounts_with_business
  FROM public.review_submissions rs
  JOIN public.prompt_pages pp ON rs.prompt_page_id = pp.id
  JOIN public.businesses b ON b.account_id = pp.account_id
  WHERE rs.platform = 'Google Business Profile';

  -- How many would successfully update
  SELECT COUNT(*) INTO successful_joins
  FROM public.review_submissions rs
  JOIN public.prompt_pages pp ON rs.prompt_page_id = pp.id
  JOIN public.businesses b ON b.account_id = pp.account_id
  WHERE rs.platform = 'Google Business Profile'
  AND rs.business_id IS NULL;

  RAISE NOTICE 'Total GBP reviews: %', total_gbp;
  RAISE NOTICE 'With prompt_page_id: %', with_prompt_page;
  RAISE NOTICE 'Prompt pages with account_id: %', prompt_pages_with_account;
  RAISE NOTICE 'Accounts that have businesses: %', accounts_with_business;
  RAISE NOTICE 'Reviews that would get business_id: %', successful_joins;
END $$;
