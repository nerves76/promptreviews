/**
 * Prompt Page Data Mapping Utility
 * 
 * Centralizes the mapping between camelCase form data and snake_case database columns
 * to ensure consistency across all prompt page creation and update operations.
 */

export interface FormData {
  // Basic fields
  name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  role?: string;
  review_type?: string;
  campaign_type?: string;
  status?: string;
  
  // Feature toggles (camelCase from forms)
  emojiSentimentEnabled?: boolean;
  aiButtonEnabled?: boolean;
  fixGrammarEnabled?: boolean;
  fallingEnabled?: boolean;
  offerEnabled?: boolean;
  nfcTextEnabled?: boolean;
  notePopupEnabled?: boolean;
  showFriendlyNote?: boolean;
  
  // Content fields
  emojiSentimentQuestion?: string;
  emojiFeedbackMessage?: string;
  emojiFeedbackPopupHeader?: string;
  emojiFeedbackPageHeader?: string;
  emojiThankYouMessage?: string;
  emojiLabels?: string[];
  falling_icon?: string;
  falling_icon_color?: string;
  offer_title?: string;
  offer_body?: string;
  offer_url?: string;
  friendly_note?: string;
  
  // Product/Service specific
  product_name?: string;
  product_description?: string;
  product_photo?: string;
  features_or_benefits?: string[];
  services_offered?: string[] | string;
  
  // Platforms
  review_platforms?: any[];
  
  // Other
  slug?: string;
  account_id?: string;
}

export interface DatabaseRow {
  account_id?: string;
  status?: string;
  review_type?: string;
  campaign_type?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  role?: string;
  slug?: string;
  review_platforms?: any[];
  services_offered?: string[];
  product_name?: string;
  product_description?: string;
  product_photo?: string;
  features_or_benefits?: string[];
  ai_button_enabled?: boolean;
  fix_grammar_enabled?: boolean;
  emoji_sentiment_enabled?: boolean;
  emoji_sentiment_question?: string;
  emoji_feedback_message?: string;
  emoji_feedback_popup_header?: string;
  emoji_feedback_page_header?: string;
  emoji_thank_you_message?: string;
  emoji_labels?: string[];
  falling_enabled?: boolean;
  falling_icon?: string;
  falling_icon_color?: string;
  offer_enabled?: boolean;
  offer_title?: string;
  offer_body?: string;
  offer_url?: string;
  friendly_note?: string;
  nfc_text_enabled?: boolean;
  note_popup_enabled?: boolean;
  show_friendly_note?: boolean;
}

/**
 * Maps camelCase form data to snake_case database columns
 * with proper validation and defaults
 */
export function mapFormDataToDatabase(formData: FormData): DatabaseRow {
  // Start with a clean object
  const mappedData: DatabaseRow = {};
  
  // Direct field mappings (already in correct format)
  const directFields = [
    'account_id', 'status', 'review_type', 'campaign_type', 'name', 
    'first_name', 'last_name', 'email', 'phone', 'role', 'slug',
    'review_platforms', 'product_name', 'product_description', 'product_photo',
    'features_or_benefits', 'falling_icon', 'falling_icon_color',
    'offer_title', 'offer_body', 'offer_url', 'friendly_note', 'emoji_labels',
    'emoji_sentiment_question', 'emoji_feedback_message', 
    'emoji_feedback_popup_header', 'emoji_feedback_page_header', 'emoji_thank_you_message'
  ];
  
  directFields.forEach(field => {
    if (formData[field as keyof FormData] !== undefined) {
      mappedData[field as keyof DatabaseRow] = formData[field as keyof FormData] as any;
    }
  });
  
  // CamelCase to snake_case mappings
  const camelToSnakeMap = {
    emojiSentimentEnabled: 'emoji_sentiment_enabled',
    aiButtonEnabled: 'ai_button_enabled',
    fixGrammarEnabled: 'fix_grammar_enabled',
    fallingEnabled: 'falling_enabled',
    offerEnabled: 'offer_enabled',
    nfcTextEnabled: 'nfc_text_enabled',
    notePopupEnabled: 'note_popup_enabled',
    showFriendlyNote: 'show_friendly_note'
  };
  
  Object.entries(camelToSnakeMap).forEach(([camelKey, snakeKey]) => {
    if (formData[camelKey as keyof FormData] !== undefined) {
      mappedData[snakeKey as keyof DatabaseRow] = formData[camelKey as keyof FormData] as any;
    }
  });
  
  // Handle special cases
  
  // Campaign type validation
  if (formData.campaign_type && !['public', 'individual'].includes(formData.campaign_type)) {
    mappedData.campaign_type = 'individual'; // Default to individual if invalid
  }
  
  // Services offered normalization
  if (formData.services_offered) {
    if (typeof formData.services_offered === 'string') {
      const arr = formData.services_offered
        .split(/\r?\n/)
        .map((s: string) => s.trim())
        .filter(Boolean);
      mappedData.services_offered = arr.length > 0 ? arr : undefined;
    } else {
      mappedData.services_offered = formData.services_offered;
    }
  }
  
  // Review platforms with word count validation
  if (formData.review_platforms) {
    mappedData.review_platforms = formData.review_platforms.map(
      (link: any) => ({
        ...link,
        wordCount: link.wordCount
          ? Math.max(200, Number(link.wordCount))
          : 200,
      })
    );
  }
  
  // Set defaults for boolean fields if not provided
  const booleanDefaults = {
    ai_button_enabled: false,
    fix_grammar_enabled: false,
    emoji_sentiment_enabled: false,
    falling_enabled: false,
    offer_enabled: false,
    nfc_text_enabled: false,
    note_popup_enabled: false,
    show_friendly_note: false
  };
  
  Object.entries(booleanDefaults).forEach(([key, defaultValue]) => {
    if (mappedData[key as keyof DatabaseRow] === undefined) {
      mappedData[key as keyof DatabaseRow] = defaultValue as any;
    }
  });
  
  return mappedData;
}

/**
 * Filters mapped data to only include allowed database columns
 * This prevents any unwanted fields from being inserted
 */
export function filterToAllowedColumns(data: DatabaseRow): DatabaseRow {
  const allowedColumns = [
    "account_id", "status", "review_type", "campaign_type", "name",
    "first_name", "last_name", "email", "phone", "role", "slug",
    "review_platforms", "services_offered", "product_name", "product_description",
    "product_photo", "features_or_benefits", "ai_button_enabled", "fix_grammar_enabled",
    "emoji_sentiment_enabled", "emoji_sentiment_question", "emoji_feedback_message",
    "emoji_feedback_popup_header", "emoji_feedback_page_header", "emoji_thank_you_message",
    "emoji_labels", "falling_enabled", "falling_icon", "falling_icon_color",
    "offer_enabled", "offer_title", "offer_body", "offer_url", "friendly_note",
    "nfc_text_enabled", "note_popup_enabled", "show_friendly_note"
  ];
  
  const filtered: DatabaseRow = {};
  allowedColumns.forEach(column => {
    if (data[column as keyof DatabaseRow] !== undefined) {
      filtered[column as keyof DatabaseRow] = data[column as keyof DatabaseRow];
    }
  });
  
  return filtered;
}

/**
 * Main function to convert form data to database-ready format
 * Combines mapping and filtering in one step
 */
export function preparePromptPageData(formData: FormData): DatabaseRow {
  const mapped = mapFormDataToDatabase(formData);
  return filterToAllowedColumns(mapped);
}

/**
 * Validates required fields based on campaign type
 */
export function validatePromptPageData(data: DatabaseRow): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Required fields for all campaigns
  if (!data.review_type) {
    errors.push('Review type is required');
  }
  
  if (!data.campaign_type) {
    errors.push('Campaign type is required');
  }
  
  // Required fields for individual campaigns
  if (data.campaign_type === 'individual') {
    if (!data.first_name) {
      errors.push('First name is required for individual campaigns');
    }
    if (!data.email) {
      errors.push('Email is required for individual campaigns');
    }
  }
  
  // Required fields for public campaigns
  if (data.campaign_type === 'public') {
    if (!data.name) {
      errors.push('Campaign name is required for public campaigns');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
} 