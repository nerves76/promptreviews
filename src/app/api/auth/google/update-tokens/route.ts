/**
 * API Route: POST /api/auth/google/update-tokens
 * Updates Google Business Profile tokens in the database after automatic refresh
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

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
      console.log('❌ Authentication error in update-tokens API:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { access_token, refresh_token, expires_at } = await request.json();

    if (!access_token || !refresh_token || !expires_at) {
      return NextResponse.json({ 
        error: 'Missing required token data' 
      }, { status: 400 });
    }

    console.log('💾 Updating Google Business Profile tokens for user:', user.id);

    // Update tokens in database
    const { error: updateError } = await supabase
      .from('google_business_profiles')
      .update({
        access_token,
        refresh_token,
        expires_at,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('❌ Error updating tokens:', updateError);
      return NextResponse.json({ 
        error: 'Failed to update tokens' 
      }, { status: 500 });
    }

    console.log('✅ Google Business Profile tokens updated successfully');
    
    return NextResponse.json({ 
      success: true,
      message: 'Tokens updated successfully' 
    });

  } catch (error) {
    console.error('❌ Error in update-tokens API:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 