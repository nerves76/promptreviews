-- Add 'ai_overview' (Google AI Overviews) as an LLM visibility provider
-- AI Overviews are AI-generated summaries at the top of Google search results.
-- Uses DataForSEO SERP API with load_async_ai_overview: true.

-- Drop the existing inline CHECK constraint on llm_provider
-- PostgreSQL auto-names inline CHECK constraints as {table}_{column}_check
ALTER TABLE llm_visibility_checks
  DROP CONSTRAINT IF EXISTS llm_visibility_checks_llm_provider_check;

-- Re-add with ai_overview included
ALTER TABLE llm_visibility_checks
  ADD CONSTRAINT llm_visibility_checks_llm_provider_check
  CHECK (llm_provider IN ('chatgpt', 'claude', 'gemini', 'perplexity', 'ai_overview'));

-- Update column comment
COMMENT ON COLUMN llm_visibility_checks.llm_provider IS 'Which AI assistant: chatgpt, claude, gemini, perplexity, ai_overview';
