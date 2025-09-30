/**
 * Style Defaults Configuration
 *
 * Single source of truth for default style settings across the application.
 * Used by:
 * - API routes when creating new businesses
 * - Style modal for initial state and reset functionality
 * - Database migrations for setting defaults
 */

export const GLASSY_DEFAULTS = {
  primary_font: 'Inter',
  secondary_font: 'Roboto',
  primary_color: '#FFFFFF',
  secondary_color: '#FFFFFF',
  background_type: 'gradient' as const,
  background_color: '#FFFFFF',
  gradient_start: '#2563EB',
  gradient_middle: '#7864C8',
  gradient_end: '#914AAE',
  card_bg: '#FFFFFF',
  card_text: '#FFFFFF', // White text for glassy design
  card_placeholder_color: '#9CA3AF',
  card_transparency: 0.30,
  card_border_width: 1,
  card_border_color: '#FFFFFF',
  card_border_transparency: 0.5,
  card_inner_shadow: true,
  card_shadow_color: '#FFFFFF',
  card_shadow_intensity: 0.30,
  kickstarters_background_design: false,
  input_text_color: '#1F2937', // Default dark text for inputs
} as const;

// Input field text color - now customizable via style settings
export const INPUT_TEXT_COLOR = '#1F2937';

export type StyleDefaults = typeof GLASSY_DEFAULTS;