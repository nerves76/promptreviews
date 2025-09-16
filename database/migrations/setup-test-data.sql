-- Setup test data for local development
-- Run this with: psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -f setup-test-data.sql

-- Insert test user into auth.users first
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role,
  aud
) VALUES (
  '12345678-1234-5678-9abc-123456789012',
  '00000000-0000-0000-0000-000000000000',
  'test@example.com',
  '$2a$10$vK8W9C8jWR0L8xV7O6P7eOO7L8Q2N5R6R7S8T9U0V1W2X3Y4Z5A6B7',
  now(),
  now(), 
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"first_name": "Test", "last_name": "User"}',
  false,
  'authenticated',
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- Insert account
INSERT INTO accounts (
  id,
  user_id,
  email,
  first_name,
  last_name,
  business_name,
  plan,
  created_at,
  updated_at
) VALUES (
  '87654321-4321-8765-cba9-876543210987',
  '12345678-1234-5678-9abc-123456789012',
  'test@example.com',
  'Test',
  'User',
  'Test Business',
  'free',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- Insert business profile
INSERT INTO businesses (
  id,
  account_id,
  name,
  business_name,
  industry,
  website_url,
  review_platforms,
  created_at,
  updated_at
) VALUES (
  '11111111-2222-3333-4444-555555555555',
  '87654321-4321-8765-cba9-876543210987',
  'Test Business',
  'Test Business',
  ARRAY['Technology'],
  'https://example.com',
  '[{"name": "Google Business Profile", "url": "https://g.page/testbusiness"}]'::jsonb,
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- Insert universal prompt page
INSERT INTO prompt_pages (
  id,
  account_id,
  slug,
  is_universal,
  status,
  campaign_type,
  review_platforms,
  created_at,
  updated_at
) VALUES (
  '99999999-8888-7777-6666-555555555555',
  '87654321-4321-8765-cba9-876543210987',
  'universal-test-12345',
  true,
  'published',
  'universal',
  '[{"name": "Google Business Profile", "url": "https://g.page/testbusiness"}]'::jsonb,
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- Print success message
SELECT 'Test account created successfully!' as message,
       'test@example.com' as email,
       'universal-test-12345' as universal_slug;