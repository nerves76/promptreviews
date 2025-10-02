/**
 * Admin Critical Monitoring API Endpoint
 *
 * This endpoint provides admin-level access to critical function health metrics.
 * Uses service role key to query critical_function_health view which is restricted to service_role only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isAdmin } from '@/auth/utils/admin';

// Service role client for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Get current user session for admin check
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify user and check admin status
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const adminStatus = await isAdmin(user.id, supabaseAdmin);
    if (!adminStatus) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Fetch critical function health metrics using service role
    const { data: healthData, error: healthError } = await supabaseAdmin
      .from('critical_function_health')
      .select('*')
      .order('hour', { ascending: false })
      .limit(50);

    if (healthError) {
      console.error('Error fetching critical function health:', healthError);
      return NextResponse.json({ error: 'Error fetching health data' }, { status: 500 });
    }

    // Fetch recent errors using service role
    const { data: errors, error: errorsError } = await supabaseAdmin
      .from('critical_function_errors')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(20);

    if (errorsError) {
      console.error('Error fetching critical errors:', errorsError);
      return NextResponse.json({ error: 'Error fetching errors data' }, { status: 500 });
    }

    return NextResponse.json({
      healthData: healthData || [],
      errors: errors || []
    });

  } catch (error) {
    console.error('Admin critical monitoring error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
