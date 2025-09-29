/**
 * Google Token Cipher
 *
 * Provides AES-256-GCM encryption/decryption for Google OAuth tokens
 * stored in the optimizer_sessions table.
 *
 * Security features:
 * - AES-256-GCM encryption with authentication
 * - Key versioning for rotation
 * - Server-only execution guard
 * - Secure random IV generation
 */

import crypto from 'crypto';

// Server-only guard
if (typeof window !== 'undefined') {
  throw new Error('googleTokenCipher.ts can only be used on the server');
}

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const KEY_VERSION = 'v1';

/**
 * Gets the encryption key for the specified version
 */
function getEncryptionKey(version: string = KEY_VERSION): Buffer {
  const keyEnvVar = version === 'v1'
    ? process.env.GOOGLE_TOKEN_ENCRYPTION_KEY
    : process.env[`GOOGLE_TOKEN_ENCRYPTION_KEY_${version.toUpperCase()}`];

  if (!keyEnvVar) {
    throw new Error(`Encryption key not found for version ${version}`);
  }

  // The key should be a 32-byte hex string (64 characters)
  if (keyEnvVar.length !== 64) {
    throw new Error('Encryption key must be 32 bytes (64 hex characters)');
  }

  return Buffer.from(keyEnvVar, 'hex');
}

/**
 * Encrypts a token using AES-256-GCM
 *
 * @param plaintext - The token to encrypt
 * @param keyVersion - The key version to use (defaults to current)
 * @returns Object containing encrypted data, IV, auth tag, and key version
 */
export function encryptToken(
  plaintext: string,
  keyVersion: string = KEY_VERSION
): {
  encrypted: string;
  iv: string;
  authTag: string;
  keyVersion: string;
} {
  try {
    const key = getEncryptionKey(keyVersion);
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      keyVersion
    };
  } catch (error) {
    console.error('Token encryption failed:', error);
    throw new Error('Failed to encrypt token');
  }
}

/**
 * Decrypts a token using AES-256-GCM
 *
 * @param encrypted - The encrypted token data
 * @param iv - The initialization vector used for encryption
 * @param authTag - The authentication tag from encryption
 * @param keyVersion - The key version used for encryption
 * @returns The decrypted token
 */
export function decryptToken(
  encrypted: string,
  iv: string,
  authTag: string,
  keyVersion: string = KEY_VERSION
): string {
  try {
    const key = getEncryptionKey(keyVersion);
    const ivBuffer = Buffer.from(iv, 'hex');
    const authTagBuffer = Buffer.from(authTag, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, ivBuffer);
    decipher.setAuthTag(authTagBuffer);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Token decryption failed:', error);
    throw new Error('Failed to decrypt token');
  }
}

/**
 * Combines encryption data into a single string for storage
 * Format: version:iv:authTag:encrypted
 */
export function packEncryptedToken(data: {
  encrypted: string;
  iv: string;
  authTag: string;
  keyVersion: string;
}): string {
  return `${data.keyVersion}:${data.iv}:${data.authTag}:${data.encrypted}`;
}

/**
 * Unpacks a combined encrypted token string
 */
export function unpackEncryptedToken(packed: string): {
  encrypted: string;
  iv: string;
  authTag: string;
  keyVersion: string;
} {
  const parts = packed.split(':');
  if (parts.length !== 4) {
    throw new Error('Invalid encrypted token format');
  }

  return {
    keyVersion: parts[0],
    iv: parts[1],
    authTag: parts[2],
    encrypted: parts[3]
  };
}

/**
 * Convenience function to encrypt and pack a token
 */
export function encryptAndPackToken(plaintext: string): string {
  const encrypted = encryptToken(plaintext);
  return packEncryptedToken(encrypted);
}

/**
 * Convenience function to unpack and decrypt a token
 */
export function unpackAndDecryptToken(packed: string): string {
  const data = unpackEncryptedToken(packed);
  return decryptToken(data.encrypted, data.iv, data.authTag, data.keyVersion);
}

/**
 * Generates a new encryption key for key rotation
 * Run this locally to generate a new key, don't call in production
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex');
}