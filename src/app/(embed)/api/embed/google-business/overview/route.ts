import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateSession } from '@/lib/services/optimizerLeadService';
import { unpackAndDecryptToken } from '@/lib/crypto/googleTokenCipher';
import { buildOverviewData } from '@/lib/googleBusiness/overviewAggregator';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get('locationId') || searchParams.get('location');

    if (!locationId) {
      return NextResponse.json({ error: 'Location ID is required' }, { status: 400 });
    }

    const authHeader = request.headers.get('authorization');
    const sessionHeader = request.headers.get('x-session-token');

    let sessionToken: string | null = null;

    if (authHeader?.startsWith('Bearer ')) {
      sessionToken = authHeader.substring(7).trim();
    } else if (sessionHeader) {
      sessionToken = sessionHeader.trim();
    }

    if (!sessionToken) {
      return NextResponse.json({ error: 'Missing or invalid session token' }, { status: 401 });
    }

    let sessionInfo;
    try {
      sessionInfo = await validateSession(sessionToken);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );

    const { data: session, error: sessionError } = await supabaseAdmin
      .from('optimizer_sessions')
      .select('*')
      .eq('id', sessionInfo.sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (!session.google_access_token_cipher) {
      return NextResponse.json({ error: 'Google Business Profile not connected' }, { status: 400 });
    }

    let accessToken: string;
    let refreshToken: string | undefined;
    try {
      accessToken = session.google_token_key_version
        ? unpackAndDecryptToken(session.google_access_token_cipher)
        : session.google_access_token_cipher;

      if (session.google_refresh_token_cipher) {
        refreshToken = session.google_token_key_version
          ? unpackAndDecryptToken(session.google_refresh_token_cipher)
          : session.google_refresh_token_cipher;
      }
    } catch (decryptError) {
      console.error('Failed to decrypt access token:', decryptError);
      return NextResponse.json({ error: 'Failed to access Google credentials' }, { status: 500 });
    }

    try {
      const overviewData = await buildOverviewData({
        tokens: {
          accessToken,
          refreshToken,
          expiresAt: session.google_token_expires_at ? new Date(session.google_token_expires_at).getTime() : undefined,
        },
        locationId,
      });

      return NextResponse.json({ success: true, data: overviewData });
    } catch (error: any) {
      console.error('Embed overview fetch failed:', error);
      return NextResponse.json({ error: error.message || 'Failed to fetch overview data' }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Unexpected error in embed overview route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
