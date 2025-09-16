-- Migration: Add missing prompt page types to enum
-- Date: 2025-01-31
-- Purpose: Add 'event', 'employee', 'video' to prompt_page_type enum

-- Add missing enum values
ALTER TYPE prompt_page_type ADD VALUE IF NOT EXISTS 'event';
ALTER TYPE prompt_page_type ADD VALUE IF NOT EXISTS 'employee';
ALTER TYPE prompt_page_type ADD VALUE IF NOT EXISTS 'video';

-- Update comment to reflect all available types
COMMENT ON COLUMN prompt_pages.type IS 'Type of prompt page (universal, service, product, photo, event, employee, video)'; 