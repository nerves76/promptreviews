/**
 * Environment variable validation and typed access.
 *
 * Call `validateEnv()` once at startup (e.g. in instrumentation.ts) to fail
 * fast with a clear error listing ALL missing required variables.
 *
 * Import `env` anywhere in server code for typed access to validated values.
 */

// ---------------------------------------------------------------------------
// Required server-only variables (no NEXT_PUBLIC_ prefix)
// ---------------------------------------------------------------------------
const REQUIRED_SERVER_VARS = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'STRIPE_SECRET_KEY',
  'RESEND_API_KEY',
  'STRIPE_WEBHOOK_SECRET',
] as const;

// ---------------------------------------------------------------------------
// Required public variables (NEXT_PUBLIC_ prefix, available in both client
// and server bundles)
// ---------------------------------------------------------------------------
const REQUIRED_PUBLIC_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_APP_URL',
] as const;

// ---------------------------------------------------------------------------
// Optional variables -- warn if missing but don't fail startup
// ---------------------------------------------------------------------------
const OPTIONAL_VARS = [
  'OPENAI_API_KEY',
  'NEXT_PUBLIC_SENTRY_DSN',
  'NEXT_PUBLIC_GA_TRACKING_ID',
  'CRON_SECRET_TOKEN',
] as const;

// ---------------------------------------------------------------------------
// Types derived from the const arrays above
// ---------------------------------------------------------------------------
type RequiredServerVar = (typeof REQUIRED_SERVER_VARS)[number];
type RequiredPublicVar = (typeof REQUIRED_PUBLIC_VARS)[number];
type OptionalVar = (typeof OPTIONAL_VARS)[number];

export type ServerEnv = Record<RequiredServerVar, string> &
  Record<RequiredPublicVar, string> &
  Record<OptionalVar, string | undefined>;

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
let _validated = false;

/**
 * Validate that all required environment variables are set.
 *
 * Throws an error listing every missing required variable so the developer
 * can fix them all in one pass rather than playing whack-a-mole.
 *
 * Logs warnings for missing optional variables.
 */
export function validateEnv(): ServerEnv {
  const missing: string[] = [];

  for (const name of REQUIRED_SERVER_VARS) {
    if (!process.env[name]) {
      missing.push(name);
    }
  }

  for (const name of REQUIRED_PUBLIC_VARS) {
    if (!process.env[name]) {
      missing.push(name);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variable${missing.length > 1 ? 's' : ''}:\n` +
        missing.map((v) => `  - ${v}`).join('\n') +
        '\n\nAdd them to .env.local (development) or your hosting provider (production).',
    );
  }

  // Warn about optional vars that are not set
  const missingOptional: string[] = [];
  for (const name of OPTIONAL_VARS) {
    if (!process.env[name]) {
      missingOptional.push(name);
    }
  }
  if (missingOptional.length > 0) {
    console.warn(
      `[env] Optional environment variable${missingOptional.length > 1 ? 's' : ''} not set (some features may be unavailable):\n` +
        missingOptional.map((v) => `  - ${v}`).join('\n'),
    );
  }

  _validated = true;

  // Return the typed env object so callers can use it directly
  return buildEnvObject();
}

// ---------------------------------------------------------------------------
// Typed env access
// ---------------------------------------------------------------------------

function buildEnvObject(): ServerEnv {
  const obj: Record<string, string | undefined> = {};

  for (const name of REQUIRED_SERVER_VARS) {
    obj[name] = process.env[name]!;
  }
  for (const name of REQUIRED_PUBLIC_VARS) {
    obj[name] = process.env[name]!;
  }
  for (const name of OPTIONAL_VARS) {
    obj[name] = process.env[name];
  }

  return obj as ServerEnv;
}

/**
 * Typed, validated environment object.
 *
 * Required variables are typed as `string` (guaranteed present after
 * `validateEnv()` has run). Optional variables are `string | undefined`.
 *
 * NOTE: Only use this on the server side. The object includes
 * SUPABASE_SERVICE_ROLE_KEY and other secrets that must never reach
 * the browser.
 */
export const env: ServerEnv = new Proxy({} as ServerEnv, {
  get(_target, prop: string) {
    if (!_validated) {
      // Allow access before validation in edge cases (e.g., module-level
      // imports that run before instrumentation), but log a warning in dev.
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          `[env] Accessing env.${prop} before validateEnv() was called. ` +
            'Values are not guaranteed to be present.',
        );
      }
    }
    return process.env[prop];
  },
});
