/**
 * API endpoint to check admin status server-side
 * This bypasses RLS policy issues by running the check on the server
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
    
    console.log('check-admin: Checking admin status for user:', user.id, user.email);
    
    // Check if user is admin
    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('id')
      .eq('account_id', user.id)
      .single();
    
    if (adminError) {
      console.error('check-admin: Admin check error:', {
        message: adminError.message,
        details: adminError.details,
        hint: adminError.hint,
        code: adminError.code
      });
      
      // If it's a "no rows returned" error, user is not admin
      if (adminError.code === 'PGRST116') {
        return NextResponse.json({ isAdmin: false, user: user.id });
      }
      
      return NextResponse.json({ 
        isAdmin: false, 
        error: 'Database error checking admin status',
        details: adminError
      }, { status: 500 });
    }
    
    const isAdmin = !!admin;
    console.log('check-admin: Admin status result:', { user: user.id, isAdmin });
    
    return NextResponse.json({ 
      isAdmin, 
      user: user.id,
      adminRecord: admin
    });
    
  } catch (error) {
    console.error('Unexpected error in check-admin:', error);
    return NextResponse.json({ 
      isAdmin: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 