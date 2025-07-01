export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateName(name: string): boolean {
  return typeof name === 'string' && name.trim().length > 0 && name.length <= 100;
}

export function validatePlatform(platform: string): boolean {
  const validPlatforms = [
    "Google Business Profile",
    "Yelp", 
    "Facebook",
    "TripAdvisor",
    "Angi",
    "Houzz",
    "BBB",
    "Thumbtack",
    "HomeAdvisor",
    "Trustpilot",
    "Other"
  ];
  return typeof platform === 'string' && validPlatforms.includes(platform);
}

export function validateReviewSubmission(data: {
  promptPageId?: string;
  platform?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  review_content?: string;
  status?: string;
}): ValidationResult {
  const errors: string[] = [];

  // Required field validation
  if (!data.promptPageId || typeof data.promptPageId !== 'string') {
    errors.push("Prompt page ID is required");
  }

  if (!data.platform || !validatePlatform(data.platform)) {
    errors.push("Valid platform is required");
  }

  if (!data.first_name || !validateName(data.first_name)) {
    errors.push("Valid first name is required");
  }

  if (!data.status || typeof data.status !== 'string') {
    errors.push("Status is required");
  }

  // Optional field validation
  if (data.last_name && typeof data.last_name !== 'string') {
    errors.push("Last name must be a string");
  }

  if (data.email && !validateEmail(data.email)) {
    errors.push("Valid email format required");
  }

  if (data.review_content && (typeof data.review_content !== 'string' || data.review_content.length > 5000)) {
    errors.push("Review content must be a string and under 5000 characters");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}