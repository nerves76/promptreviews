/**
 * API endpoint to check admin status server-side
 * UPDATED: Now uses simple is_admin column in accounts table for better reliability
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ isAdmin: false, error: 'No authenticated user' }, { status: 401 });
    }
    
    
    // Check if user is admin using simple is_admin column
    const { data: account, error: adminError } = await supabase
      .from('accounts')
      .select('is_admin')
      .eq('id', user.id)
      .maybeSingle();
    
    if (adminError) {
      console.error('check-admin: Admin check error:', {
        message: adminError.message,
        details: adminError.details,
        hint: adminError.hint,
        code: adminError.code
      });
      
      return NextResponse.json({ 
        isAdmin: false, 
        error: 'Database error checking admin status',
        details: adminError
      }, { status: 500 });
    }
    
    const isAdmin = !!(account?.is_admin);
    
    return NextResponse.json({ 
      isAdmin, 
      user: user.id,
      account: account
    });
    
  } catch (error) {
    console.error('check-admin: Unexpected error:', error);
    return NextResponse.json({ 
      isAdmin: false, 
      error: 'Unexpected error checking admin status' 
    }, { status: 500 });
  }
} 