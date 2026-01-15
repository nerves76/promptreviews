/**
 * Check Email API Route
 *
 * Checks if an email address is already registered.
 * Used during signup to provide early feedback to users.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/auth/providers/supabase';
import { applyRateLimit, createRateLimitResponse, RateLimits } from '@/app/(app)/api/middleware/rate-limit';

interface CheckEmailRequest {
  email: string;
}

export async function POST(request: NextRequest) {
  // Apply persistent rate limiting (Supabase-backed)
  const rateLimitResult = await applyRateLimit(request, RateLimits.emailCheck);
  if (!rateLimitResult.success) {
    return createRateLimitResponse(rateLimitResult);
  }

  try {
    const body: CheckEmailRequest = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    // Check if user exists with this email
    const { data: users, error } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1,
    });

    if (error) {
      console.error('Error checking email:', error);
      // Don't expose internal errors, just say email is available
      return NextResponse.json({ exists: false });
    }

    // Search for the email in users
    // Note: listUsers doesn't support filtering, so we need to check accounts table
    const { data: account } = await supabase
      .from('accounts')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    return NextResponse.json({
      exists: !!account,
    });

  } catch (error) {
    console.error('Check email error:', error);
    // On error, don't block signup - they'll get the error at final submit
    return NextResponse.json({ exists: false });
  }
}
