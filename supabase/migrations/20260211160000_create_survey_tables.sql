-- =============================================================================
-- Survey Builder Tables
-- =============================================================================

-- 1. survey_templates - Pre-built templates (must exist before surveys references it)
CREATE TABLE IF NOT EXISTS survey_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE survey_templates ENABLE ROW LEVEL SECURITY;

-- Templates are readable by all authenticated users
CREATE POLICY "survey_templates_select" ON survey_templates
  FOR SELECT TO authenticated
  USING (is_active = true);

-- 2. surveys - Core survey definition
CREATE TABLE IF NOT EXISTS surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'closed')),
  use_business_styling BOOLEAN NOT NULL DEFAULT true,
  thank_you_message TEXT DEFAULT 'Thank you for your response!',
  show_progress_bar BOOLEAN NOT NULL DEFAULT true,
  collect_respondent_info BOOLEAN NOT NULL DEFAULT false,
  require_respondent_email BOOLEAN NOT NULL DEFAULT false,
  one_response_per_email BOOLEAN NOT NULL DEFAULT false,
  free_responses_remaining INTEGER NOT NULL DEFAULT 10,
  agency_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  is_onboarding_survey BOOLEAN NOT NULL DEFAULT false,
  target_client_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  template_id UUID REFERENCES survey_templates(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_surveys_account_id ON surveys(account_id);
CREATE INDEX idx_surveys_slug ON surveys(slug);
CREATE INDEX idx_surveys_status ON surveys(status);

ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "surveys_select" ON surveys
  FOR SELECT TO authenticated
  USING (account_id IN (
    SELECT account_id FROM account_users WHERE user_id = auth.uid()
  ));

CREATE POLICY "surveys_insert" ON surveys
  FOR INSERT TO authenticated
  WITH CHECK (account_id IN (
    SELECT account_id FROM account_users WHERE user_id = auth.uid()
  ));

CREATE POLICY "surveys_update" ON surveys
  FOR UPDATE TO authenticated
  USING (account_id IN (
    SELECT account_id FROM account_users WHERE user_id = auth.uid()
  ));

CREATE POLICY "surveys_delete" ON surveys
  FOR DELETE TO authenticated
  USING (account_id IN (
    SELECT account_id FROM account_users WHERE user_id = auth.uid()
  ));

-- 3. survey_questions - Questions within a survey
CREATE TABLE IF NOT EXISTS survey_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  question_type TEXT NOT NULL CHECK (question_type IN (
    'text', 'multiple_choice_single', 'multiple_choice_multi', 'rating_star', 'rating_number'
  )),
  question_text TEXT NOT NULL,
  description TEXT,
  is_required BOOLEAN NOT NULL DEFAULT false,
  options JSONB DEFAULT '[]'::jsonb,
  allow_other BOOLEAN NOT NULL DEFAULT false,
  rating_min INTEGER DEFAULT 1,
  rating_max INTEGER DEFAULT 5,
  rating_labels JSONB DEFAULT '{}'::jsonb,
  text_max_length INTEGER DEFAULT 1000,
  text_placeholder TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_survey_questions_survey_position ON survey_questions(survey_id, position);

ALTER TABLE survey_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "survey_questions_select" ON survey_questions
  FOR SELECT TO authenticated
  USING (survey_id IN (
    SELECT id FROM surveys WHERE account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "survey_questions_insert" ON survey_questions
  FOR INSERT TO authenticated
  WITH CHECK (survey_id IN (
    SELECT id FROM surveys WHERE account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "survey_questions_update" ON survey_questions
  FOR UPDATE TO authenticated
  USING (survey_id IN (
    SELECT id FROM surveys WHERE account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "survey_questions_delete" ON survey_questions
  FOR DELETE TO authenticated
  USING (survey_id IN (
    SELECT id FROM surveys WHERE account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
  ));

-- 4. survey_responses - One row per completed submission
CREATE TABLE IF NOT EXISTS survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  respondent_name TEXT,
  respondent_email TEXT,
  respondent_phone TEXT,
  answers JSONB NOT NULL DEFAULT '[]'::jsonb,
  source_channel TEXT DEFAULT 'direct' CHECK (source_channel IN ('direct', 'qr', 'email', 'sms')),
  utm_params JSONB DEFAULT '{}'::jsonb,
  user_agent TEXT,
  is_free_response BOOLEAN NOT NULL DEFAULT false,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_survey_responses_survey_id ON survey_responses(survey_id);
CREATE INDEX idx_survey_responses_account_id ON survey_responses(account_id);
CREATE INDEX idx_survey_responses_submitted_at ON survey_responses(submitted_at);

ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "survey_responses_select" ON survey_responses
  FOR SELECT TO authenticated
  USING (account_id IN (
    SELECT account_id FROM account_users WHERE user_id = auth.uid()
  ));

-- Insert is done via service role (public submissions), no user policy needed for insert

-- 5. survey_response_packs - Purchasable response capacity
CREATE TABLE IF NOT EXISTS survey_response_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  response_count INTEGER NOT NULL,
  credit_cost INTEGER NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE survey_response_packs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "survey_response_packs_select" ON survey_response_packs
  FOR SELECT TO authenticated
  USING (is_active = true);

-- Seed response packs
INSERT INTO survey_response_packs (name, response_count, credit_cost, display_order) VALUES
  ('Starter', 50, 5, 1),
  ('Growth', 100, 8, 2),
  ('Professional', 500, 30, 3),
  ('Business', 1000, 50, 4),
  ('Enterprise', 5000, 200, 5);

-- 6. survey_response_purchases - Tracks pack purchases per survey
CREATE TABLE IF NOT EXISTS survey_response_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  pack_id UUID NOT NULL REFERENCES survey_response_packs(id),
  responses_purchased INTEGER NOT NULL,
  responses_used INTEGER NOT NULL DEFAULT 0,
  credit_ledger_id TEXT,
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_survey_response_purchases_survey ON survey_response_purchases(survey_id);
CREATE INDEX idx_survey_response_purchases_account ON survey_response_purchases(account_id);

ALTER TABLE survey_response_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "survey_response_purchases_select" ON survey_response_purchases
  FOR SELECT TO authenticated
  USING (account_id IN (
    SELECT account_id FROM account_users WHERE user_id = auth.uid()
  ));

CREATE POLICY "survey_response_purchases_insert" ON survey_response_purchases
  FOR INSERT TO authenticated
  WITH CHECK (account_id IN (
    SELECT account_id FROM account_users WHERE user_id = auth.uid()
  ));

-- =============================================================================
-- Seed CSAT Template
-- =============================================================================

INSERT INTO survey_templates (name, description, category, questions, display_order) VALUES
(
  'Customer satisfaction (CSAT)',
  'Measure customer satisfaction with a quick 4-question survey covering overall rating, recommendation, strengths, and improvement areas.',
  'satisfaction',
  '[
    {
      "question_type": "rating_star",
      "question_text": "How satisfied are you with our service?",
      "description": "Rate your overall experience",
      "is_required": true,
      "rating_min": 1,
      "rating_max": 5,
      "rating_labels": {"1": "Very dissatisfied", "3": "Neutral", "5": "Very satisfied"}
    },
    {
      "question_type": "multiple_choice_single",
      "question_text": "How likely are you to recommend us to a friend or colleague?",
      "is_required": true,
      "options": ["Very likely", "Likely", "Neutral", "Unlikely", "Very unlikely"]
    },
    {
      "question_type": "text",
      "question_text": "What did we do well?",
      "description": "Tell us what you enjoyed about your experience",
      "is_required": false,
      "text_placeholder": "Share what stood out to you...",
      "text_max_length": 1000
    },
    {
      "question_type": "text",
      "question_text": "How can we improve?",
      "description": "Your feedback helps us get better",
      "is_required": false,
      "text_placeholder": "Let us know how we can do better...",
      "text_max_length": 1000
    }
  ]'::jsonb,
  1
);
