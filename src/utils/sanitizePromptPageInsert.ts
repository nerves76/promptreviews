export function sanitizePromptPageInsert(data: any) {
  // List all date fields in prompt_pages here
  const dateFields = ["date_completed"];
  const sanitized = { ...data };

  // Handle campaign_type
  if (!sanitized.campaign_type) {
    // Default to 'individual' if there's a client_name, otherwise 'public'
    sanitized.campaign_type = sanitized.client_name ? 'individual' : 'public';
  }

  for (const field of dateFields) {
    if (!sanitized[field]) {
      delete sanitized[field]; // Remove the field if falsy ("", undefined, null, 0)
    }
  }
  // Always include show_friendly_note if present
  if ("show_friendly_note" in sanitized) {
    sanitized.show_friendly_note = Boolean(sanitized.show_friendly_note);
  }
  return sanitized;
}
