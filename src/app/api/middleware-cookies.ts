/**
 * Cookie configuration helper for consistent SameSite settings
 * This provides basic CSRF protection without breaking functionality
 */

export const SECURE_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const, // Protects against CSRF for most cases
  path: '/',
};

export const AUTH_COOKIE_OPTIONS = {
  ...SECURE_COOKIE_OPTIONS,
  sameSite: 'strict' as const, // Stricter for auth cookies
  maxAge: 60 * 60 * 24 * 7, // 7 days
};

/**
 * Helper to set secure cookies in API routes
 */
export function setSecureCookie(
  response: Response,
  name: string,
  value: string,
  options = SECURE_COOKIE_OPTIONS
) {
  const cookieString = `${name}=${value}; ${Object.entries(options)
    .map(([key, val]) => {
      if (key === 'maxAge') return `Max-Age=${val}`;
      if (key === 'httpOnly' && val) return 'HttpOnly';
      if (key === 'secure' && val) return 'Secure';
      if (key === 'sameSite') return `SameSite=${val}`;
      if (key === 'path') return `Path=${val}`;
      return '';
    })
    .filter(Boolean)
    .join('; ')}`;
    
  response.headers.append('Set-Cookie', cookieString);
}