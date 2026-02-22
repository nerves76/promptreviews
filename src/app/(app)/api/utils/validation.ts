/**
 * Shared API Input Validation Utilities
 *
 * Reusable validators for common input patterns across API routes:
 * - UUID format validation
 * - Slug format validation
 * - File upload validation (type and size)
 * - String length enforcement
 * - URL format validation
 */

// ---------------------------------------------------------------------------
// Regex patterns
// ---------------------------------------------------------------------------

/** Matches standard UUID v1-v5 format */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Matches lowercase alphanumeric slugs with hyphens */
const SLUG_REGEX = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/;

/** Basic URL pattern - starts with http:// or https:// */
const URL_REGEX = /^https?:\/\/.+/i;

// ---------------------------------------------------------------------------
// UUID validation
// ---------------------------------------------------------------------------

/**
 * Returns true if `value` is a valid UUID string.
 */
export function isValidUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_REGEX.test(value);
}

/**
 * Validate a UUID parameter and return an error message if invalid.
 * Returns `null` when the value is valid.
 */
export function validateUuid(value: unknown, fieldName = 'id'): string | null {
  if (!value || typeof value !== 'string') {
    return `${fieldName} is required`;
  }
  if (!UUID_REGEX.test(value)) {
    return `${fieldName} must be a valid UUID`;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Slug validation
// ---------------------------------------------------------------------------

const MAX_SLUG_LENGTH = 200;

/**
 * Returns true if `value` is a valid slug string.
 */
export function isValidSlug(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= MAX_SLUG_LENGTH &&
    SLUG_REGEX.test(value)
  );
}

/**
 * Validate a slug parameter and return an error message if invalid.
 * Returns `null` when the value is valid.
 */
export function validateSlug(value: unknown, fieldName = 'slug'): string | null {
  if (!value || typeof value !== 'string') {
    return `${fieldName} is required`;
  }
  if (value.length > MAX_SLUG_LENGTH) {
    return `${fieldName} must be ${MAX_SLUG_LENGTH} characters or less`;
  }
  if (!SLUG_REGEX.test(value)) {
    return `${fieldName} must contain only lowercase letters, numbers, and hyphens`;
  }
  return null;
}

// ---------------------------------------------------------------------------
// String length validation
// ---------------------------------------------------------------------------

/** Sensible default limits by content type */
export const STRING_LIMITS = {
  name: 200,
  description: 2000,
  reviewText: 5000,
  url: 2000,
  email: 320,
  phone: 50,
  shortText: 500,
  longText: 10000,
} as const;

/**
 * Validate that a string value does not exceed `maxLength`.
 * If the value is falsy the check passes (use a separate required-check if needed).
 * Returns an error message string or `null` if valid.
 */
export function validateStringLength(
  value: unknown,
  fieldName: string,
  maxLength: number,
): string | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value !== 'string') {
    return `${fieldName} must be a string`;
  }
  if (value.length > maxLength) {
    return `${fieldName} must be ${maxLength} characters or less`;
  }
  return null;
}

/**
 * Validate a required string field that must be present and within length limits.
 */
export function validateRequiredString(
  value: unknown,
  fieldName: string,
  maxLength: number,
): string | null {
  if (!value || typeof value !== 'string' || value.trim().length === 0) {
    return `${fieldName} is required`;
  }
  if (value.length > maxLength) {
    return `${fieldName} must be ${maxLength} characters or less`;
  }
  return null;
}

// ---------------------------------------------------------------------------
// URL validation
// ---------------------------------------------------------------------------

/**
 * Validate an optional URL string.
 * Returns an error message or `null` if valid (or empty).
 */
export function validateUrl(value: unknown, fieldName = 'url'): string | null {
  if (!value || value === '') return null;
  if (typeof value !== 'string') {
    return `${fieldName} must be a string`;
  }
  if (value.length > STRING_LIMITS.url) {
    return `${fieldName} must be ${STRING_LIMITS.url} characters or less`;
  }
  if (!URL_REGEX.test(value)) {
    return `${fieldName} must be a valid HTTP or HTTPS URL`;
  }
  return null;
}

// ---------------------------------------------------------------------------
// File upload validation
// ---------------------------------------------------------------------------

/** Allowed image MIME types */
const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]);

/** Allowed document MIME types */
const ALLOWED_DOCUMENT_TYPES = new Set([
  'application/pdf',
]);

/** All allowed file MIME types */
const ALL_ALLOWED_TYPES = new Set([
  ...ALLOWED_IMAGE_TYPES,
  ...ALLOWED_DOCUMENT_TYPES,
]);

/** Max file sizes in bytes */
export const FILE_SIZE_LIMITS = {
  image: 10 * 1024 * 1024,      // 10 MB
  document: 50 * 1024 * 1024,   // 50 MB
} as const;

export interface FileValidationOptions {
  /** Maximum file size in bytes. Defaults to 10 MB for images. */
  maxSizeBytes?: number;
  /** Set of allowed MIME types. Defaults to image types only. */
  allowedTypes?: Set<string>;
  /** Human-readable label for error messages. Defaults to "File". */
  fieldName?: string;
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate a file from FormData.
 *
 * @param file - The File object (or unknown value from FormData.get())
 * @param options - Validation options
 */
export function validateFileUpload(
  file: unknown,
  options: FileValidationOptions = {},
): FileValidationResult {
  const {
    maxSizeBytes = FILE_SIZE_LIMITS.image,
    allowedTypes = ALLOWED_IMAGE_TYPES,
    fieldName = 'File',
  } = options;

  // Check that a file was provided
  if (!file || typeof file === 'string') {
    return { valid: false, error: `${fieldName} is required` };
  }

  // Type guard: file must be a File/Blob with type and size
  const f = file as File;
  if (typeof f.type !== 'string' || typeof f.size !== 'number') {
    return { valid: false, error: `${fieldName} is not a valid file` };
  }

  // Validate MIME type
  if (!allowedTypes.has(f.type)) {
    const typesList = Array.from(allowedTypes)
      .map((t) => t.replace('image/', '').replace('application/', ''))
      .join(', ');
    return {
      valid: false,
      error: `${fieldName} type "${f.type}" is not allowed. Accepted types: ${typesList}`,
    };
  }

  // Validate file size
  if (f.size > maxSizeBytes) {
    const maxMB = (maxSizeBytes / (1024 * 1024)).toFixed(0);
    const actualMB = (f.size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `${fieldName} is ${actualMB}MB which exceeds the ${maxMB}MB limit`,
    };
  }

  return { valid: true };
}

// ---------------------------------------------------------------------------
// CSV / Upload file validation (non-image)
// ---------------------------------------------------------------------------

const ALLOWED_CSV_TYPES = new Set([
  'text/csv',
  'application/vnd.ms-excel',
  'text/plain', // Some systems report CSV as text/plain
]);

/** Max CSV upload size: 5 MB */
const MAX_CSV_SIZE = 5 * 1024 * 1024;

/**
 * Validate a CSV file upload.
 */
export function validateCsvUpload(
  file: unknown,
  options: { maxSizeBytes?: number; fieldName?: string } = {},
): FileValidationResult {
  const {
    maxSizeBytes = MAX_CSV_SIZE,
    fieldName = 'File',
  } = options;

  if (!file || typeof file === 'string') {
    return { valid: false, error: `${fieldName} is required` };
  }

  const f = file as File;
  if (typeof f.size !== 'number') {
    return { valid: false, error: `${fieldName} is not a valid file` };
  }

  // For CSV files, check both MIME type and extension since MIME is unreliable
  const name = (f as File).name || '';
  const hasCSVExtension = name.toLowerCase().endsWith('.csv');
  const hasAllowedType = ALLOWED_CSV_TYPES.has(f.type) || f.type === '';

  if (!hasCSVExtension && !hasAllowedType) {
    return {
      valid: false,
      error: `${fieldName} must be a CSV file`,
    };
  }

  if (f.size > maxSizeBytes) {
    const maxMB = (maxSizeBytes / (1024 * 1024)).toFixed(0);
    return {
      valid: false,
      error: `${fieldName} exceeds the ${maxMB}MB size limit`,
    };
  }

  return { valid: true };
}

// ---------------------------------------------------------------------------
// Convenience: collect errors
// ---------------------------------------------------------------------------

/**
 * Run multiple validation checks and collect all error messages.
 * Returns an array of error strings (empty = all valid).
 *
 * Example:
 * ```ts
 * const errors = collectErrors(
 *   validateUuid(body.pageId, 'pageId'),
 *   validateStringLength(body.name, 'name', 200),
 * );
 * if (errors.length > 0) {
 *   return NextResponse.json({ error: 'Validation failed', details: errors }, { status: 400 });
 * }
 * ```
 */
export function collectErrors(...results: (string | null)[]): string[] {
  return results.filter((r): r is string => r !== null);
}
