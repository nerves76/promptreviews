import crypto from 'crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

type SessionScope = Record<string, JsonValue>;

interface CreateLeadInput {
  email: string;
  sourceBusiness?: string;
  sourceDomain?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referrerUrl?: string;
  additionalData?: Record<string, JsonValue>;
}

interface CreateLeadResult {
  id: string;
  email: string;
}

interface CreateSessionInput {
  leadId?: string;
  email: string;
  scope?: SessionScope;
  expiresInMinutes?: number;
  sessionKeyVersion?: string;
}

interface CreateSessionResult {
  token: string;
  sessionId: string;
  expiresAt: string;
  sessionKeyVersion: string;
}

interface ValidateSessionResult {
  sessionId: string;
  leadId: string | null;
  email: string | null;
  payload: Record<string, JsonValue>;
}

const DEFAULT_AUDIENCE = 'google-biz-optimizer-embed';
const DEFAULT_ISSUER = 'promptreviews';
const DEFAULT_EXPIRY_MINUTES = 45;

let cachedSupabaseClient: SupabaseClient | null = null;

function getSessionSecret(): string {
  const secret = process.env.EMBED_SESSION_SECRET;
  if (!secret) {
    throw new Error('EMBED_SESSION_SECRET environment variable is required for Google Biz Optimizer sessions');
  }
  return secret;
}

function getSessionKeyVersion(): string {
  return process.env.EMBED_SESSION_KEY_VERSION || 'v1';
}

function getSupabaseAdminClient(): SupabaseClient {
  if (cachedSupabaseClient) {
    return cachedSupabaseClient;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Supabase service role credentials are required for optimizer lead/session operations');
  }

  cachedSupabaseClient = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  return cachedSupabaseClient;
}

function toBase64Url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

export function hashSessionToken(token: string): string {
  return crypto.createHash('sha256').update(token, 'utf8').digest('hex');
}

function createSignedJwt(payload: Record<string, JsonValue>, secret: string): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = toBase64Url(JSON.stringify(header));
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const data = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto.createHmac('sha256', secret).update(data).digest();
  const encodedSignature = toBase64Url(signature);
  return `${data}.${encodedSignature}`;
}

function verifySignedJwt(token: string, secret: string): Record<string, JsonValue> {
  const segments = token.split('.');
  if (segments.length !== 3) {
    throw new Error('Invalid session token');
  }

  const [encodedHeader, encodedPayload, encodedSignature] = segments;
  const headerJson = Buffer.from(encodedHeader, 'base64').toString('utf8');
  const header = JSON.parse(headerJson);

  if (header.alg !== 'HS256') {
    throw new Error(`Unsupported JWT algorithm: ${header.alg}`);
  }

  const data = `${encodedHeader}.${encodedPayload}`;
  const expectedSignature = toBase64Url(crypto.createHmac('sha256', secret).update(data).digest());

  if (encodedSignature.length !== expectedSignature.length) {
    throw new Error('Invalid session signature');
  }

  if (!crypto.timingSafeEqual(Buffer.from(encodedSignature, 'utf8'), Buffer.from(expectedSignature, 'utf8'))) {
    throw new Error('Invalid session signature');
  }

  const payloadJson = Buffer.from(encodedPayload, 'base64').toString('utf8');
  const payload = JSON.parse(payloadJson) as Record<string, JsonValue>;

  const now = Math.floor(Date.now() / 1000);
  const exp = typeof payload.exp === 'number' ? payload.exp : 0;

  if (!exp || exp <= now) {
    throw new Error('Session token expired');
  }

  return payload;
}

export async function createLead(input: CreateLeadInput): Promise<CreateLeadResult> {
  const supabase = getSupabaseAdminClient();

  const payload: Record<string, JsonValue> = {
    email: input.email.trim().toLowerCase(),
    source_business: input.sourceBusiness || 'promptreviews',
    source_domain: input.sourceDomain || null,
    utm_source: input.utmSource || null,
    utm_medium: input.utmMedium || null,
    utm_campaign: input.utmCampaign || null,
    referrer_url: input.referrerUrl || null,
    ...input.additionalData,
  };

  const { data, error } = await supabase
    .from('optimizer_leads')
    .upsert(payload, { onConflict: 'email,source_business', ignoreDuplicates: false })
    .select('id, email')
    .single();

  if (error) {
    throw new Error(`Failed to upsert optimizer lead: ${error.message}`);
  }

  return { id: data.id, email: data.email };
}

export async function createSession(input: CreateSessionInput): Promise<CreateSessionResult> {
  const secret = getSessionSecret();
  const sessionKeyVersion = input.sessionKeyVersion || getSessionKeyVersion();
  const supabase = getSupabaseAdminClient();

  const nowSeconds = Math.floor(Date.now() / 1000);
  const expiresInMinutes = input.expiresInMinutes || DEFAULT_EXPIRY_MINUTES;
  const expSeconds = nowSeconds + expiresInMinutes * 60;
  const expiresAtIso = new Date(expSeconds * 1000).toISOString();

  const jwtPayload: Record<string, JsonValue> = {
    aud: DEFAULT_AUDIENCE,
    iss: DEFAULT_ISSUER,
    sub: input.leadId || input.email,
    email: input.email,
    scope: input.scope || {},
    iat: nowSeconds,
    exp: expSeconds,
    ver: sessionKeyVersion,
  };

  const token = createSignedJwt(jwtPayload, secret);
  const tokenHash = hashSessionToken(token);

  const { data, error } = await supabase
    .from('optimizer_sessions')
    .insert({
      session_token_hash: tokenHash,
      session_scope: input.scope || {},
      session_key_version: sessionKeyVersion,
      email: input.email,
      lead_id: input.leadId || null,
      expires_at: expiresAtIso,
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to create optimizer session: ${error.message}`);
  }

  return {
    token,
    sessionId: data.id,
    expiresAt: expiresAtIso,
    sessionKeyVersion,
  };
}

export async function validateSession(token: string): Promise<ValidateSessionResult> {
  const secret = getSessionSecret();
  const payload = verifySignedJwt(token, secret);
  const tokenHash = hashSessionToken(token);

  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from('optimizer_sessions')
    .select('id, lead_id, email, expires_at')
    .eq('session_token_hash', tokenHash)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to verify optimizer session: ${error.message}`);
  }

  if (!data) {
    throw new Error('Session not found or already invalidated');
  }

  if (!data.expires_at || new Date(data.expires_at).getTime() <= Date.now()) {
    throw new Error('Session expired');
  }

  return {
    sessionId: data.id,
    leadId: data.lead_id,
    email: data.email,
    payload,
  };
}

export async function invalidateSessionsByVersion(version: string): Promise<number> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('optimizer_sessions')
    .update({ expires_at: new Date().toISOString() })
    .eq('session_key_version', version)
    .select('id');

  if (error) {
    throw new Error(`Failed to invalidate sessions for version ${version}: ${error.message}`);
  }

  return data?.length || 0;
}

export async function purgeExpiredSessions(): Promise<number> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('optimizer_sessions')
    .delete()
    .lt('expires_at', new Date().toISOString())
    .select('id');

  if (error) {
    throw new Error(`Failed to purge expired optimizer sessions: ${error.message}`);
  }

  return data?.length || 0;
}
