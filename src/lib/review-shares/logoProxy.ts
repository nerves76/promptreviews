import crypto from 'crypto';

const LOGO_PROXY_SECRET =
  process.env.LOGO_PROXY_SIGNING_SECRET ||
  process.env.EMBED_SESSION_SECRET ||
  process.env.SUPABASE_SERVICE_ROLE_KEY; // Final fallback to maintain backwards compatibility

if (!LOGO_PROXY_SECRET) {
  throw new Error('Missing LOGO_PROXY_SIGNING_SECRET (or EMBED_SESSION_SECRET) for logo proxy signing');
}

function getSignature(bucket: string, path: string) {
  return crypto
    .createHmac('sha256', LOGO_PROXY_SECRET!)
    .update(`${bucket}:${path}`)
    .digest('hex');
}

export function createSignedLogoUrl(bucket: string, path: string, origin?: string) {
  const normalizedOrigin = (origin || process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '');
  const token = getSignature(bucket, path);
  const base = normalizedOrigin || 'http://localhost:3000';
  const url = new URL('/api/review-shares/logo', base);
  url.searchParams.set('bucket', bucket);
  url.searchParams.set('path', path);
  url.searchParams.set('token', token);
  return url.toString();
}

export function verifyLogoSignature(bucket: string, path: string, token?: string | null) {
  if (!token) return false;
  const expected = getSignature(bucket, path);
  try {
    return crypto.timingSafeEqual(Buffer.from(token, 'hex'), Buffer.from(expected, 'hex'));
  } catch {
    return false;
  }
}
