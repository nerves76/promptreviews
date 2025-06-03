export function sanitizePromptPageInsert(data: any) {
  // List all date fields in prompt_pages here
  const dateFields = ["date_completed"];
  const sanitized = { ...data };
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
