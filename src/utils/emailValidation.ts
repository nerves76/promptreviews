/**
 * Email Validation and Security Utilities
 * 
 * This module provides comprehensive email validation, domain checking,
 * and security measures for invitation system.
 */

// Common disposable/temporary email domains to block
const DISPOSABLE_EMAIL_DOMAINS = new Set([
  '10minutemail.com',
  '20minutemail.com',
  'guerrillamail.com',
  'mailinator.com',
  'tempmail.org',
  'temp-mail.org',
  'yopmail.com',
  'throwaway.email',
  'getnada.com',
  'tempail.com',
  'dispostable.com',
  'sharklasers.com',
  'guerrillamailblock.com',
  'pokemail.net',
  'spam4.me',
  'boun.cr',
  'deadaddress.com',
  'emkei.gq',
  'fakeinbox.com',
  'hidemail.de',
  'mytemp.email',
  'no-spam.ws',
  'owlymail.com',
  'spamgourmet.com',
  'tmailinator.com',
  'trashmail.com',
  'wegwerfmail.de'
]);

// Common typos of popular email domains
const EMAIL_DOMAIN_TYPOS: Record<string, string> = {
  'gmail.co': 'gmail.com',
  'gmail.om': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gmial.com': 'gmail.com',
  'gmal.com': 'gmail.com',
  'yaho.com': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
  'yahoo.co': 'yahoo.com',
  'outloo.com': 'outlook.com',
  'outlok.com': 'outlook.com',
  'hotmial.com': 'hotmail.com',
  'hotmai.com': 'hotmail.com',
  'hotmal.com': 'hotmail.com',
  'live.co': 'live.com',
  'msn.co': 'msn.com'
};

export interface EmailValidationResult {
  isValid: boolean;
  email: string;
  errors: string[];
  warnings: string[];
  suggestions?: string[];
  domain: string;
  isDisposable: boolean;
  isBusinessEmail: boolean;
  riskScore: number; // 0-100, higher = more risky
}

export interface EmailValidationOptions {
  allowDisposable?: boolean;
  requireBusinessEmail?: boolean;
  domainWhitelist?: string[];
  domainBlacklist?: string[];
  maxRiskScore?: number;
  suggestCorrections?: boolean;
}

/**
 * Comprehensive email validation with security checks
 */
export function validateEmail(
  email: string, 
  options: EmailValidationOptions = {}
): EmailValidationResult {
  const {
    allowDisposable = false,
    requireBusinessEmail = false,
    domainWhitelist = [],
    domainBlacklist = [],
    maxRiskScore = 70,
    suggestCorrections = true
  } = options;

  const result: EmailValidationResult = {
    isValid: true,
    email: email.toLowerCase().trim(),
    errors: [],
    warnings: [],
    suggestions: [],
    domain: '',
    isDisposable: false,
    isBusinessEmail: false,
    riskScore: 0
  };

  // Basic format validation
  if (!result.email || typeof result.email !== 'string') {
    result.errors.push('Email is required');
    result.isValid = false;
    result.riskScore = 100;
    return result;
  }

  // RFC 5322 email regex (more permissive but secure)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  if (!emailRegex.test(result.email)) {
    result.errors.push('Invalid email format');
    result.isValid = false;
    result.riskScore += 50;
  }

  // Extract domain
  const emailParts = result.email.split('@');
  if (emailParts.length !== 2) {
    result.errors.push('Invalid email format - missing or multiple @ symbols');
    result.isValid = false;
    result.riskScore += 50;
    return result;
  }

  const [localPart, domain] = emailParts;
  result.domain = domain.toLowerCase();

  // Local part validation
  if (localPart.length === 0) {
    result.errors.push('Email local part cannot be empty');
    result.isValid = false;
    result.riskScore += 30;
  }

  if (localPart.length > 64) {
    result.errors.push('Email local part too long (max 64 characters)');
    result.isValid = false;
    result.riskScore += 20;
  }

  // Domain validation
  if (result.domain.length === 0) {
    result.errors.push('Email domain cannot be empty');
    result.isValid = false;
    result.riskScore += 50;
  }

  if (result.domain.length > 253) {
    result.errors.push('Email domain too long (max 253 characters)');
    result.isValid = false;
    result.riskScore += 20;
  }

  // Check for disposable email domains
  result.isDisposable = DISPOSABLE_EMAIL_DOMAINS.has(result.domain);
  if (result.isDisposable && !allowDisposable) {
    result.errors.push('Disposable email addresses are not allowed');
    result.isValid = false;
    result.riskScore += 40;
  } else if (result.isDisposable) {
    result.warnings.push('This appears to be a disposable email address');
    result.riskScore += 20;
  }

  // Check business email vs free email providers
  const freeEmailDomains = new Set([
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com',
    'aol.com', 'icloud.com', 'mail.com', 'zoho.com', 'protonmail.com'
  ]);
  
  result.isBusinessEmail = !freeEmailDomains.has(result.domain) && !result.isDisposable;
  
  if (requireBusinessEmail && !result.isBusinessEmail) {
    result.errors.push('Business email address required');
    result.isValid = false;
    result.riskScore += 30;
  }

  // Domain whitelist check
  if (domainWhitelist.length > 0 && !domainWhitelist.includes(result.domain)) {
    result.errors.push(`Email domain not in allowed list: ${domainWhitelist.join(', ')}`);
    result.isValid = false;
    result.riskScore += 50;
  }

  // Domain blacklist check
  if (domainBlacklist.includes(result.domain)) {
    result.errors.push('Email domain is not allowed');
    result.isValid = false;
    result.riskScore += 50;
  }

  // Typo detection and suggestions
  if (suggestCorrections && EMAIL_DOMAIN_TYPOS[result.domain]) {
    const suggestedDomain = EMAIL_DOMAIN_TYPOS[result.domain];
    const suggestedEmail = `${localPart}@${suggestedDomain}`;
    result.suggestions?.push(`Did you mean: ${suggestedEmail}?`);
    result.warnings.push(`Possible typo detected in domain: ${result.domain}`);
    result.riskScore += 10;
  }

  // Suspicious patterns
  if (localPart.includes('test') || localPart.includes('temp') || localPart.includes('fake')) {
    result.warnings.push('Email appears to contain test/temporary keywords');
    result.riskScore += 15;
  }

  // Sequential characters (potential fake)
  if (/(.)\1{3,}/.test(localPart)) {
    result.warnings.push('Email contains suspicious repeated characters');
    result.riskScore += 10;
  }

  // Risk score validation
  if (result.riskScore > maxRiskScore) {
    result.errors.push(`Email risk score (${result.riskScore}) exceeds maximum allowed (${maxRiskScore})`);
    result.isValid = false;
  }

  return result;
}

/**
 * Validate multiple emails at once
 */
export function validateEmails(
  emails: string[],
  options: EmailValidationOptions = {}
): { valid: EmailValidationResult[]; invalid: EmailValidationResult[] } {
  const results = emails.map(email => validateEmail(email, options));
  
  return {
    valid: results.filter(r => r.isValid),
    invalid: results.filter(r => !r.isValid)
  };
}

/**
 * Check if an email domain is likely to be a business domain
 */
export function isBusinessDomain(domain: string): boolean {
  const freeEmailDomains = new Set([
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com',
    'aol.com', 'icloud.com', 'mail.com', 'zoho.com', 'protonmail.com'
  ]);
  
  return !freeEmailDomains.has(domain.toLowerCase()) && !DISPOSABLE_EMAIL_DOMAINS.has(domain.toLowerCase());
}

/**
 * Get domain from email address
 */
export function getEmailDomain(email: string): string {
  const parts = email.split('@');
  return parts.length === 2 ? parts[1].toLowerCase() : '';
}

/**
 * Normalize email address (lowercase, trim)
 */
export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * Check if email appears to be role-based (like support@, admin@, etc.)
 */
export function isRoleBasedEmail(email: string): boolean {
  const rolePrefixes = [
    'admin', 'administrator', 'support', 'help', 'info', 'contact',
    'sales', 'marketing', 'noreply', 'no-reply', 'donotreply',
    'webmaster', 'postmaster', 'hostmaster', 'abuse', 'security',
    'privacy', 'legal', 'compliance', 'billing', 'finance'
  ];
  
  const localPart = email.split('@')[0]?.toLowerCase() || '';
  return rolePrefixes.some(prefix => localPart.includes(prefix));
}

/**
 * Advanced email validation for invitation system
 */
export function validateInvitationEmail(email: string, context: {
  accountDomain?: string;
  isOwnerInvite?: boolean;
  allowRoleEmails?: boolean;
} = {}): EmailValidationResult {
  const {
    accountDomain,
    isOwnerInvite = false,
    allowRoleEmails = false
  } = context;

  // Base validation - Remove business email requirement as it's too restrictive
  const result = validateEmail(email, {
    allowDisposable: false,
    requireBusinessEmail: false, // Allow all valid emails (Gmail, Yahoo, etc.)
    maxRiskScore: isOwnerInvite ? 60 : 80, // Slightly stricter for owner invites but still reasonable
    suggestCorrections: true
  });

  // Additional invitation-specific checks
  if (result.isValid) {
    // Check for role-based emails
    if (!allowRoleEmails && isRoleBasedEmail(email)) {
      result.warnings.push('This appears to be a role-based email address');
      result.riskScore += 15;
    }

    // Check if inviting someone from same domain (potential internal invite)
    if (accountDomain && result.domain === accountDomain.toLowerCase()) {
      result.warnings.push('Inviting user from same domain as account');
      // This might be normal for large organizations, so just warn
    }

    // Extra security for owner invites - Just warn, don't block
    if (isOwnerInvite && !result.isBusinessEmail) {
      result.warnings.push('Tip: Business emails are often preferred for owner roles, but personal emails work too');
      result.riskScore += 10; // Reduced penalty
    }
  }

  return result;
} 