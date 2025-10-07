/**
 * Community API - Input Validation Helpers
 *
 * Validates user input before database operations
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

const ALLOWED_REACTIONS = ['thumbs_up', 'star', 'celebrate', 'clap', 'laugh'] as const;
export type ReactionType = typeof ALLOWED_REACTIONS[number];

const USERNAME_REGEX = /^[a-z0-9-]+$/;

/**
 * Validate post creation data
 */
export function validatePostData(data: any): ValidationResult {
  const errors: string[] = [];

  // Title validation
  if (!data.title || typeof data.title !== 'string') {
    errors.push('Title is required');
  } else if (data.title.trim().length === 0) {
    errors.push('Title cannot be empty');
  } else if (data.title.length > 200) {
    errors.push('Title must be 200 characters or less');
  }

  // Body validation (optional but has limits)
  if (data.body && typeof data.body !== 'string') {
    errors.push('Body must be a string');
  } else if (data.body && data.body.length > 10000) {
    errors.push('Body must be 10,000 characters or less');
  }

  // External URL validation (optional)
  if (data.external_url) {
    if (typeof data.external_url !== 'string') {
      errors.push('External URL must be a string');
    } else if (!data.external_url.match(/^https?:\/\/.+/i)) {
      errors.push('External URL must be a valid HTTP/HTTPS URL');
    }
  }

  // Channel ID validation
  if (!data.channel_id || typeof data.channel_id !== 'string') {
    errors.push('Channel ID is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate comment creation data
 */
export function validateCommentData(data: any): ValidationResult {
  const errors: string[] = [];

  // Body validation (required for comments)
  if (!data.body || typeof data.body !== 'string') {
    errors.push('Comment body is required');
  } else if (data.body.trim().length === 0) {
    errors.push('Comment body cannot be empty');
  } else if (data.body.length > 10000) {
    errors.push('Comment body must be 10,000 characters or less');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate reaction type
 */
export function validateReaction(reaction: any): ValidationResult {
  const errors: string[] = [];

  if (!reaction || typeof reaction !== 'string') {
    errors.push('Reaction type is required');
  } else if (!ALLOWED_REACTIONS.includes(reaction as ReactionType)) {
    errors.push(`Invalid reaction type. Must be one of: ${ALLOWED_REACTIONS.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate username format
 */
export function validateUsername(username: any): ValidationResult {
  const errors: string[] = [];

  if (!username || typeof username !== 'string') {
    errors.push('Username is required');
  } else if (!USERNAME_REGEX.test(username)) {
    errors.push('Username must only contain lowercase letters, numbers, and hyphens');
  } else if (username.length < 3 || username.length > 50) {
    errors.push('Username must be between 3 and 50 characters');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate display name override
 */
export function validateDisplayName(displayName: any): ValidationResult {
  const errors: string[] = [];

  if (displayName !== null && displayName !== undefined) {
    if (typeof displayName !== 'string') {
      errors.push('Display name must be a string');
    } else if (displayName.length > 100) {
      errors.push('Display name must be 100 characters or less');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate pagination parameters
 */
export function validatePagination(params: { limit?: any; offset?: any }) {
  const limit = parseInt(params.limit as string, 10) || 20;
  const offset = parseInt(params.offset as string, 10) || 0;

  // Enforce limits
  const safeLimit = Math.min(Math.max(limit, 1), 100); // Min 1, max 100
  const safeOffset = Math.max(offset, 0); // Min 0

  return {
    limit: safeLimit,
    offset: safeOffset
  };
}
