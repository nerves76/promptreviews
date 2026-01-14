/**
 * Check Email API Route
 *
 * Checks if an email address is already registered.
 * Used during signup to provide early feedback to users.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/auth/providers/supabase';

interface CheckEmailRequest {
  email: string;
}

// Rate limiter for email check: 20 attempts per 15 minutes per IP
// Slightly more permissive than signup since users may check multiple emails
const checkEmailRateLimiter = {
  limits: new Map<string, { count: number; resetTime: number }>(),
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 20,
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const entry = this.limits.get(identifier);
    if (!entry || now > entry.resetTime) {
      this.limits.set(identifier, { count: 1, resetTime: now + this.windowMs });
      return true;
    }
    if (entry.count >= this.maxRequests) return false;
    entry.count++;
    return true;
  }
};

export async function POST(request: NextRequest) {
  // Rate limit by IP address (prevent email enumeration attacks)
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';

  if (!checkEmailRateLimiter.isAllowed(ip)) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': '900' } }
    );
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
