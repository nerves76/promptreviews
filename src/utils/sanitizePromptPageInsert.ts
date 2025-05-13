export function sanitizePromptPageInsert(data: any) {
  // List all date fields in prompt_pages here
  const dateFields = ['date_completed'];
  const sanitized = { ...data };
  for (const field of dateFields) {
    if (!sanitized[field]) {
      delete sanitized[field]; // Remove the field if falsy ("", undefined, null, 0)
    }
  }
  return sanitized;
} 