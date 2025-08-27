/**
 * API Route: POST /api/social-posting/platforms/google-business-profile/validate-connection
 * Validates Google Business Profile tokens by making a test API call
 * Should only be called when actually needed (e.g., when posting)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { GoogleBusinessProfileClient } from '@/features/social-posting/platforms/google-business-profile/googleBusinessProfileClient';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name) => {
            return cookieStore.get(name)?.value;
          },
          set: (name, value, options) => {
            cookieStore.set({ name, value, ...options });
          },
          remove: (name, options) => {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.log('Authentication error in validate-connection API:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔍 Manual token validation requested');

    // Create service role client for accessing OAuth tokens (bypasses RLS)
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get Google Business Profile tokens
    const { data: tokens, error: tokenError } = await serviceSupabase
      .from('google_business_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (tokenError || !tokens) {
      console.log('Google Business Profile tokens not found for user:', user.id, tokenError);
      return NextResponse.json({ 
        isValid: false,
        error: 'Google Business Profile not connected'
      });
    }

    console.log('✅ Found Google Business Profile tokens for user:', user.id);

    // Create Google Business Profile client and test the connection
    const client = new GoogleBusinessProfileClient({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: new Date(tokens.expires_at).getTime()
    });

    try {
      // Test the connection with a simple accounts call
      console.log('🔍 Testing Google Business Profile connection...');
      const accounts = await client.listAccounts();
      console.log(`✅ Token validation successful - found ${accounts.length} accounts`);
      
      return NextResponse.json({
        isValid: true,
        accountCount: accounts.length,
        message: `Connection validated - found ${accounts.length} account${accounts.length !== 1 ? 's' : ''}`
      });
      
    } catch (error: any) {
      console.error('❌ Google token validation failed:', error);
      
      let errorMessage = 'Google Business Profile connection issue. Please try reconnecting.';
      if (error.message?.includes('GOOGLE_REAUTH_REQUIRED')) {
        errorMessage = 'Google Business Profile connection expired. Please reconnect your account.';
      }
      
      return NextResponse.json({
        isValid: false,
        error: errorMessage
      });
    }

  } catch (error) {
    console.error('Error in validate-connection API:', error);
    return NextResponse.json({ 
      isValid: false,
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 