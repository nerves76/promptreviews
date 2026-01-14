/**
 * Agency Convert API Route
 *
 * POST: Submits a request to convert an account to an agency account.
 *       Sends email to admin for review - does NOT auto-convert.
 * GET: Check if current account can be converted to agency
 */

import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { NextRequest, NextResponse } from 'next/server';
import { AgencyMetadata } from '@/auth/types/auth.types';
import { sendResendEmail } from '@/utils/resend';

interface ConvertToAgencyRequest {
  metadata: AgencyMetadata;
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();

  try {
    const body: ConvertToAgencyRequest = await request.json();

    // Validate required fields
    if (!body.metadata?.agncy_type || !body.metadata?.agncy_employee_count ||
        !body.metadata?.agncy_expected_clients || !body.metadata?.agncy_multi_location_pct) {
      return NextResponse.json(
        { error: 'All agency metadata fields are required' },
        { status: 400 }
      );
    }

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get the selected account
    const accountId = await getRequestAccountId(request, user.id, supabase);

    if (!accountId) {
      return NextResponse.json(
        { error: 'No valid account found' },
        { status: 403 }
      );
    }

    // Verify user is owner of this account
    const { data: accountUser, error: roleError } = await supabase
      .from('account_users')
      .select('role')
      .eq('account_id', accountId)
      .eq('user_id', user.id)
      .single();

    if (roleError || !accountUser) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    if (accountUser.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only account owners can request agency conversion' },
        { status: 403 }
      );
    }

    // Get current account details
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('id, business_name, is_agncy, agncy_trial_end')
      .eq('id', accountId)
      .single();

    if (accountError || !account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    // Check if already an agency
    if (account.is_agncy) {
      return NextResponse.json(
        {
          error: 'Account is already an agency',
          agncy_trial_end: account.agncy_trial_end,
        },
        { status: 400 }
      );
    }

    // Check if there's already a pending request
    const { data: existingRequest } = await supabase
      .from('account_events')
      .select('id, created_at')
      .eq('account_id', accountId)
      .eq('event_type', 'agency_conversion_requested')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (existingRequest) {
      const requestDate = new Date(existingRequest.created_at);
      const daysSinceRequest = Math.floor((Date.now() - requestDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysSinceRequest < 7) {
        return NextResponse.json({
          message: 'Your agency conversion request is already being reviewed',
          status: 'pending',
          requested_at: existingRequest.created_at,
        });
      }
    }

    // Log the conversion request event
    await supabase.from('account_events').insert({
      account_id: accountId,
      event_type: 'agency_conversion_requested',
      event_data: {
        user_id: user.id,
        user_email: user.email,
        business_name: account.business_name,
        agncy_type: body.metadata.agncy_type,
        agncy_employee_count: body.metadata.agncy_employee_count,
        agncy_expected_clients: body.metadata.agncy_expected_clients,
        agncy_multi_location_pct: body.metadata.agncy_multi_location_pct,
      },
    });

    // Send email to admin for review
    const agencyTypeLabels: Record<string, string> = {
      'marketing': 'Marketing Agency',
      'seo': 'SEO Agency',
      'web_design': 'Web Design Agency',
      'full_service': 'Full Service Agency',
      'reputation': 'Reputation Management',
      'other': 'Other',
    };

    const employeeCountLabels: Record<string, string> = {
      '1': '1 (Solo)',
      '2-5': '2-5',
      '6-10': '6-10',
      '11-25': '11-25',
      '26-50': '26-50',
      '50+': '50+',
    };

    const expectedClientsLabels: Record<string, string> = {
      '1-5': '1-5 clients',
      '6-10': '6-10 clients',
      '11-25': '11-25 clients',
      '26-50': '26-50 clients',
      '50+': '50+ clients',
    };

    const multiLocationLabels: Record<string, string> = {
      '0': 'None (0%)',
      '1-25': 'Some (1-25%)',
      '26-50': 'About half (26-50%)',
      '51-75': 'Most (51-75%)',
      '76-100': 'Almost all (76-100%)',
    };

    const emailHtml = `
      <h2>New Agency Conversion Request</h2>

      <h3>Account Details</h3>
      <ul>
        <li><strong>Account ID:</strong> ${accountId}</li>
        <li><strong>Business Name:</strong> ${account.business_name || 'Not set'}</li>
        <li><strong>User Email:</strong> ${user.email}</li>
        <li><strong>User ID:</strong> ${user.id}</li>
      </ul>

      <h3>Agency Questionnaire Responses</h3>
      <ul>
        <li><strong>Agency Type:</strong> ${agencyTypeLabels[body.metadata.agncy_type] || body.metadata.agncy_type}</li>
        <li><strong>Employee Count:</strong> ${employeeCountLabels[body.metadata.agncy_employee_count] || body.metadata.agncy_employee_count}</li>
        <li><strong>Expected Clients:</strong> ${expectedClientsLabels[body.metadata.agncy_expected_clients] || body.metadata.agncy_expected_clients}</li>
        <li><strong>Multi-location Clients:</strong> ${multiLocationLabels[body.metadata.agncy_multi_location_pct] || body.metadata.agncy_multi_location_pct}</li>
      </ul>

      <h3>To Approve</h3>
      <p>Run this in the browser console while logged into an admin account:</p>
      <pre style="background: #f4f4f4; padding: 10px; border-radius: 4px;">
fetch('/api/agency/approve', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ accountId: '${accountId}' })
}).then(r => r.json()).then(console.log)
      </pre>

      <p style="color: #666; font-size: 12px; margin-top: 20px;">
        Requested at: ${new Date().toISOString()}
      </p>
    `;

    try {
      await sendResendEmail({
        to: 'support@promptreviews.app',
        subject: `Agency Conversion Request: ${account.business_name || user.email}`,
        html: emailHtml,
      });
    } catch (emailError) {
      console.error('Failed to send agency conversion email:', emailError);
      // Don't fail the request if email fails - the event is logged
    }

    return NextResponse.json({
      message: 'Your agency conversion request has been submitted for review',
      status: 'pending',
      review_time: 'We will review your account and make the conversion within 1-3 business days.',
    });

  } catch (error) {
    console.error('Agency convert API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET - Check if current account can be converted to agency
 */
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();

  try {
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get the selected account
    const accountId = await getRequestAccountId(request, user.id, supabase);

    if (!accountId) {
      return NextResponse.json(
        { error: 'No valid account found' },
        { status: 403 }
      );
    }

    // Get account details
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select(`
        id,
        business_name,
        is_agncy,
        agncy_trial_start,
        agncy_trial_end,
        agncy_type,
        agncy_employee_count,
        agncy_expected_clients,
        agncy_multi_location_pct
      `)
      .eq('id', accountId)
      .single();

    if (accountError || !account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    // Check if user is owner
    const { data: accountUser, error: roleError } = await supabase
      .from('account_users')
      .select('role')
      .eq('account_id', accountId)
      .eq('user_id', user.id)
      .single();

    const isOwner = accountUser?.role === 'owner';

    // Check for pending conversion request
    const { data: pendingRequest } = await supabase
      .from('account_events')
      .select('id, created_at')
      .eq('account_id', accountId)
      .eq('event_type', 'agency_conversion_requested')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const hasPendingRequest = pendingRequest &&
      (Date.now() - new Date(pendingRequest.created_at).getTime()) < 7 * 24 * 60 * 60 * 1000;

    return NextResponse.json({
      can_convert: !account.is_agncy && isOwner && !hasPendingRequest,
      is_agncy: account.is_agncy,
      is_owner: isOwner,
      has_pending_request: hasPendingRequest,
      pending_request_date: hasPendingRequest ? pendingRequest.created_at : null,
      account: account.is_agncy ? {
        agncy_type: account.agncy_type,
        agncy_employee_count: account.agncy_employee_count,
        agncy_expected_clients: account.agncy_expected_clients,
        agncy_multi_location_pct: account.agncy_multi_location_pct,
        agncy_trial_start: account.agncy_trial_start,
        agncy_trial_end: account.agncy_trial_end,
      } : null,
    });
  } catch (error) {
    console.error('Agency convert check API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
