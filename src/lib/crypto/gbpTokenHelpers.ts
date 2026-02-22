/**
 * GBP Token Encryption/Decryption Helpers
 *
 * Provides safe wrappers around googleTokenCipher for the main app's
 * google_business_profiles table. Handles both encrypted (prefixed with
 * "v1:") and legacy plain-text tokens during the migration period.
 *
 * Usage:
 *   import { encryptGbpToken, decryptGbpToken } from '@/lib/crypto/gbpTokenHelpers';
 *
 *   // Encrypt before storing
 *   const encrypted = encryptGbpToken(plainToken);
 *
 *   // Decrypt after reading (handles both encrypted and plain-text)
 *   const plain = decryptGbpToken(storedValue);
 */

import { encryptAndPackToken, unpackAndDecryptToken } from './googleTokenCipher';

/** Prefix that identifies an encrypted token (matches packEncryptedToken format) */
const ENCRYPTED_PREFIX = 'v1:';

/**
 * Check whether the GOOGLE_TOKEN_ENCRYPTION_KEY env var is configured.
 * If not, encryption/decryption will gracefully degrade.
 */
function isEncryptionKeyAvailable(): boolean {
  const key = process.env.GOOGLE_TOKEN_ENCRYPTION_KEY;
  return typeof key === 'string' && key.length === 64;
}

/**
 * Encrypts a token for storage in google_business_profiles.
 *
 * If the encryption key is not set, returns the plain text with a
 * server-side warning so the OAuth flow is not broken.
 */
export function encryptGbpToken(plaintext: string): string {
  if (!plaintext) return plaintext;

  if (!isEncryptionKeyAvailable()) {
    console.warn(
      '⚠️  GOOGLE_TOKEN_ENCRYPTION_KEY is not configured. ' +
      'Storing GBP token in plain text. Set this env var to enable encryption.'
    );
    return plaintext;
  }

  try {
    return encryptAndPackToken(plaintext);
  } catch (error) {
    console.error('Failed to encrypt GBP token, falling back to plain text:', error);
    return plaintext;
  }
}

/**
 * Decrypts a token read from google_business_profiles.
 *
 * Detects whether the stored value is encrypted (starts with "v1:") or
 * legacy plain text, and handles both transparently.
 */
export function decryptGbpToken(stored: string): string {
  if (!stored) return stored;

  // Plain-text tokens will never start with "v1:" because Google OAuth
  // tokens start with "ya29." (access) or "1//" (refresh).
  if (!stored.startsWith(ENCRYPTED_PREFIX)) {
    return stored;
  }

  if (!isEncryptionKeyAvailable()) {
    console.error(
      'Found encrypted GBP token but GOOGLE_TOKEN_ENCRYPTION_KEY is not set. ' +
      'Cannot decrypt — the token is unusable.'
    );
    throw new Error('Encryption key not configured but token is encrypted');
  }

  return unpackAndDecryptToken(stored);
}
