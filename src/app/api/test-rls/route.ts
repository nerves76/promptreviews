import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    // Test 1: Server client (should work like a regular authenticated user)
    const serverClient = await createServerSupabaseClient();
    const { data: { user } } = await serverClient.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' });
    }

    // Test 2: Query with server client (uses user's auth)
    const { data: serverResult, error: serverError } = await serverClient
      .from('account_users')
      .select('*')
      .eq('user_id', user.id);

    // Test 3: Service role client (bypasses RLS)
    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const { data: serviceResult, error: serviceError } = await serviceClient
      .from('account_users')
      .select('*')
      .eq('user_id', user.id);

    // Test 4: Check if RLS is enabled
    const { data: rlsCheck } = await serviceClient
      .from('pg_tables')
      .select('tablename, rowsecurity')
      .eq('schemaname', 'public')
      .eq('tablename', 'account_users')
      .single();

    // Test 5: Check what policies exist
    const { data: policies } = await serviceClient
      .rpc('get_policies_for_table', { 
        table_name: 'account_users',
        schema_name: 'public'
      }).catch(() => ({ data: null }));

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email
      },
      serverClient: {
        success: !serverError,
        recordCount: serverResult?.length || 0,
        error: serverError?.message,
        data: serverResult
      },
      serviceClient: {
        success: !serviceError,
        recordCount: serviceResult?.length || 0,
        error: serviceError?.message,
        data: serviceResult
      },
      rlsEnabled: rlsCheck?.rowsecurity || false,
      policies: policies || 'Could not fetch policies',
      diagnosis: {
        hasRecords: (serviceResult?.length || 0) > 0,
        canUserSeeRecords: (serverResult?.length || 0) > 0,
        rlsBlocking: (serviceResult?.length || 0) > 0 && (serverResult?.length || 0) === 0
      }
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}