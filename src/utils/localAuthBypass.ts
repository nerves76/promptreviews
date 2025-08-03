/**
 * Local Development Auth Bypass
 * 
 * This utility provides a way to bypass authentication during local development
 * by mocking a user session. Only works in development mode.
 */

export const DEV_USER = {
  id: '12345678-1234-5678-9abc-123456789012',
  email: 'test@example.com',
  user_metadata: {
    first_name: 'Test',
    last_name: 'User'
  }
};

export const DEV_ACCOUNT_ID = '87654321-4321-8765-cba9-876543210987';

/**
 * Creates a mock session for local development
 */
export function createMockSession() {
  if (process.env.NODE_ENV !== 'development') {
    throw new Error('Mock session only available in development');
  }
  
  return {
    access_token: 'mock-token',
    refresh_token: 'mock-refresh',
    expires_in: 3600,
    expires_at: Date.now() + 3600000,
    token_type: 'bearer',
    user: DEV_USER
  };
}

/**
 * Bypasses authentication for local development
 * Call this from your auth guard to allow local development
 */
export function bypassAuthLocally() {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 [DEV] Using auth bypass for local development');
    return {
      user: DEV_USER,
      session: createMockSession()
    };
  }
  return null;
}