import { NextRequest, NextResponse } from 'next/server';
import { createLead, createSession } from '@/lib/services/optimizerLeadService';

type RequestBody = {
  email?: string;
  leadId?: string;
  scope?: Record<string, unknown>;
  sourceBusiness?: string;
  sourceDomain?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referrerUrl?: string;
  sessionKeyVersion?: string;
  expiresInMinutes?: number;
};

const DEFAULT_DEV_ORIGINS = new Set([
  'http://localhost:3000',
  'http://localhost:3002',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3002',
]);

function resolveAllowedOrigins(): Set<string> {
  const raw = process.env.EMBED_ALLOWED_ORIGINS || '';
  const items = raw
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
  return new Set([...items, ...DEFAULT_DEV_ORIGINS]);
}

function originIsAllowed(origin: string | null, allowlist: Set<string>): boolean {
  if (!origin) return true;
  if (allowlist.has(origin)) return true;
  // Allow subdomain wildcards defined in allowlist
  for (const allowed of allowlist) {
    if (allowed.includes('*')) {
      const regex = new RegExp(`^${allowed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace('\\*', '.*')}$`);
      if (regex.test(origin)) {
        return true;
      }
    }
  }
  return false;
}

export async function POST(request: NextRequest) {
  try {
    const allowlist = resolveAllowedOrigins();
    const headerOrigin = request.headers.get('origin');
    let origin = headerOrigin;

    if (!origin) {
      const referer = request.headers.get('referer');
      if (referer) {
        try {
          origin = new URL(referer).origin;
        } catch {
          origin = null;
        }
      }
    }

    if (!originIsAllowed(origin, allowlist)) {
      return NextResponse.json({ error: 'Origin not allowed' }, { status: 403 });
    }

    const body = (await request.json()) as RequestBody;
    const email = body.email?.trim().toLowerCase();
    let leadId = body.leadId?.trim();

    if (!email) {
      return NextResponse.json({ error: 'email is required' }, { status: 400 });
    }

    if (!leadId) {
      const lead = await createLead({
        email,
        sourceBusiness: body.sourceBusiness,
        sourceDomain: body.sourceDomain,
        utmSource: body.utmSource,
        utmMedium: body.utmMedium,
        utmCampaign: body.utmCampaign,
        referrerUrl: body.referrerUrl,
      });
      leadId = lead.id;
    }

    const session = await createSession({
      leadId,
      email,
      scope: body.scope,
      sessionKeyVersion: body.sessionKeyVersion,
      expiresInMinutes: body.expiresInMinutes,
    });

    return NextResponse.json({
      token: session.token,
      expiresAt: session.expiresAt,
      sessionId: session.sessionId,
      sessionKeyVersion: session.sessionKeyVersion,
    });
  } catch (error) {
    console.error('Failed to create optimizer embed session', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
