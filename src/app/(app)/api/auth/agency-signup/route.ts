/**
 * Agency Signup API Route
 *
 * Creates a new user account and sets it up as an agency with a 30-day trial.
 * Combines user registration with agency metadata collection.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/auth/providers/supabase';
import { credit, ensureBalanceExists } from '@/lib/credits';

interface AgencySignupRequest {
  // User fields
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  businessName?: string;

  // Agency metadata
  agencyType: 'just_me' | '2_10' | '10_20' | '20_40' | '40_plus';
  planToAddClients: 'yes' | 'no';
  expectedClientCount: '1-5' | '6-10' | '11-20' | '20+';
  multiLocationPct: '0' | '25' | '50' | '75_plus';
}

// Strict rate limiter for signup: 5 attempts per 15 minutes per IP
const signupRateLimiter = {
  limits: new Map<string, { count: number; resetTime: number }>(),
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,
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
  // Rate limit by IP address (prevent signup abuse/spam)
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';

  if (!signupRateLimiter.isAllowed(ip)) {
    return NextResponse.json(
      { error: 'Too many signup attempts. Please try again in 15 minutes.' },
      { status: 429, headers: { 'Retry-After': '900' } }
    );
  }

  console.log('Agency signup API called');
  try {
    const body: AgencySignupRequest = await request.json();
    console.log('Agency signup - parsed body:', { email: body.email, agencyType: body.agencyType });

    const {
      email,
      password,
      firstName,
      lastName,
      businessName,
      agencyType,
      planToAddClients,
      expectedClientCount,
      multiLocationPct,
    } = body;

    // Validate required user fields
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Missing required user fields' },
        { status: 400 }
      );
    }

    // Validate required agency fields
    if (!agencyType || !planToAddClients || !expectedClientCount || !multiLocationPct) {
      return NextResponse.json(
        { error: 'Missing required agency fields' },
        { status: 400 }
      );
    }

    // Basic validation
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Environment sanity checks
    const missingEnv: string[] = [];
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) missingEnv.push('NEXT_PUBLIC_SUPABASE_URL');
    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) missingEnv.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missingEnv.push('SUPABASE_SERVICE_ROLE_KEY');
    if (missingEnv.length > 0) {
      return NextResponse.json(
        {
          error: 'Supabase environment variables are missing',
          details: {
            missing: missingEnv,
            hint: 'Ensure .env.local contains these keys and restart the dev server.'
          }
        },
        { status: 500 }
      );
    }

    const supabase = createServiceRoleClient();

    // Create user with service role (bypasses email confirmation)
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
      },
    });

    if (error) {
      console.error('Agency signup - user creation error:', JSON.stringify(error, null, 2));

      const errorMessage = error.message || (error as any).msg || (error as any).error_description || error.toString();

      if (errorMessage && (errorMessage.includes('already registered') || errorMessage.includes('already exists'))) {
        return NextResponse.json(
          { error: 'User already registered. Please sign in instead.' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: errorMessage || 'Failed to create account' },
        { status: 400 }
      );
    }

    if (!data.user) {
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 400 }
      );
    }

    const userId = data.user.id;

    // Wait briefly for any triggers to complete
    await new Promise(resolve => setTimeout(resolve, 500));

    // Calculate trial dates
    const trialStart = new Date();
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 30);

    // Check if account exists (trigger may have created it)
    const { data: existingAccount } = await supabase
      .from('accounts')
      .select('id')
      .eq('id', userId)
      .single();

    if (existingAccount) {
      // Update existing account to be an agency
      // Note: agncy_employee_count repurposed for planToAddClients
      const { error: updateError } = await supabase
        .from('accounts')
        .update({
          business_name: businessName || `${firstName}'s Agency`,
          plan: 'agency',
          is_agncy: true,
          agncy_trial_start: trialStart.toISOString(),
          agncy_trial_end: trialEnd.toISOString(),
          agncy_type: agencyType,
          agncy_employee_count: planToAddClients,
          agncy_expected_clients: expectedClientCount,
          agncy_multi_location_pct: multiLocationPct,
          // Agency accounts should create their business profile after signup
          business_creation_complete: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (updateError) {
        console.error('Agency signup - update error:', updateError);
        // Don't fail the signup, the user was created successfully
      }
    } else {
      // Create account manually with agency fields
      console.log('Agency signup - creating account manually for user:', userId);

      // Note: agncy_employee_count repurposed for planToAddClients
      const { error: accountError } = await supabase
        .from('accounts')
        .insert({
          id: userId,
          email,
          first_name: firstName,
          last_name: lastName,
          business_name: businessName || `${firstName}'s Agency`,
          plan: 'agency',
          trial_start: null,
          trial_end: null,
          is_free_account: false,
          has_had_paid_plan: false,
          custom_prompt_page_count: 0,
          contact_count: 0,
          review_notifications_enabled: true,
          // Agency fields
          is_agncy: true,
          agncy_trial_start: trialStart.toISOString(),
          agncy_trial_end: trialEnd.toISOString(),
          agncy_type: agencyType,
          agncy_employee_count: planToAddClients,
          agncy_expected_clients: expectedClientCount,
          agncy_multi_location_pct: multiLocationPct,
          // Agency accounts should create their business profile after signup
          business_creation_complete: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: userId,
        });

      if (accountError && accountError.code !== '23505') {
        console.error('Agency signup - account creation error:', accountError);
        // Delete the user since account creation failed
        await supabase.auth.admin.deleteUser(userId);

        return NextResponse.json(
          { error: 'Failed to create agency account. Please try again.' },
          { status: 500 }
        );
      }
    }

    // Ensure account_users link exists
    const { data: existingLink } = await supabase
      .from('account_users')
      .select('*')
      .eq('account_id', userId)
      .eq('user_id', userId)
      .single();

    if (!existingLink) {
      const { error: linkError } = await supabase
        .from('account_users')
        .insert({
          account_id: userId,
          user_id: userId,
          role: 'owner',
          created_at: new Date().toISOString()
        });

      if (linkError && linkError.code !== '23505') {
        console.error('Agency signup - account user link error:', linkError);
        await supabase.auth.admin.deleteUser(userId);

        return NextResponse.json(
          { error: 'Failed to complete account setup. Please try again.' },
          { status: 500 }
        );
      }
    }

    // Log the agency creation event
    await supabase.from('account_events').insert({
      account_id: userId,
      event_type: 'agency_created',
      event_data: {
        signup_type: 'new_account',
        agncy_type: agencyType,
        plan_to_add_clients: planToAddClients,
        expected_client_count: expectedClientCount,
        multi_location_pct: multiLocationPct,
        trial_end: trialEnd.toISOString(),
      },
    });

    // Grant initial credits for agency account (200 base credits)
    // They'll get +300 per paying client when monthly refresh runs
    const AGENCY_BASE_CREDITS = 200;
    try {
      await ensureBalanceExists(supabase, userId);

      // Calculate expiration (end of next month)
      const now = new Date();
      const endOfNextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 2, 1));

      await credit(supabase, userId, AGENCY_BASE_CREDITS, {
        creditType: 'included',
        transactionType: 'promo_grant',
        idempotencyKey: `agency_signup:${userId}`,
        description: 'Agency signup: initial 200 credits',
      });

      // Update expiration date
      await supabase
        .from('credit_balances')
        .update({
          included_credits_expire_at: endOfNextMonth.toISOString(),
          last_monthly_grant_at: now.toISOString(),
        })
        .eq('account_id', userId);

      console.log(`🏢 [Agency Signup] Granted ${AGENCY_BASE_CREDITS} initial credits to ${userId}`);
    } catch (creditError) {
      // Non-fatal - log but continue
      console.error('Agency signup - credit grant error:', creditError);
    }

    return NextResponse.json({
      success: true,
      message: 'Agency account created successfully! You can now sign in.',
      user: {
        id: data.user.id,
        email: data.user.email,
      },
      agency: {
        trial_end: trialEnd.toISOString(),
      },
    });

  } catch (error: any) {
    console.error('Agency signup exception - full error:', error);
    console.error('Agency signup exception - stack:', error?.stack);
    const errorMessage = (error && error.message) ? error.message : (typeof error === 'string' ? error : 'Internal server error');
    console.error('Agency signup exception:', errorMessage);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
