/**
 * GBP Protection Settings API
 *
 * GET: Returns protection settings for the account
 * PUT: Updates protection settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: 'No valid account found' }, { status: 403 });
    }

    // Check if user has eligible tier
    const { data: account } = await supabase
      .from('accounts')
      .select('plan, subscription_status')
      .eq('id', accountId)
      .single();

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const isEligible = account.plan === 'builder' || account.plan === 'maven';
    if (!isEligible) {
      return NextResponse.json({
        eligible: false,
        message: 'GBP Profile Protection is available for Builder and Maven plans',
        upgradeUrl: '/dashboard/plan'
      }, { status: 200 });
    }

    // Get settings for this account
    const { data: settings, error } = await supabase
      .from('gbp_protection_settings')
      .select('*')
      .eq('account_id', accountId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching settings:', error);
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }

    // Return default settings if none exist
    const defaultSettings = {
      enabled: true,
      notification_frequency: 'immediate',
      auto_reject_enabled: false,
      protected_fields: ['hours', 'address', 'phone', 'website', 'title', 'description']
    };

    return NextResponse.json({
      eligible: true,
      settings: settings || defaultSettings
    });

  } catch (error) {
    console.error('Error in settings API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: 'No valid account found' }, { status: 403 });
    }

    // Check if user has eligible tier
    const { data: account } = await supabase
      .from('accounts')
      .select('plan')
      .eq('id', accountId)
      .single();

    if (!account || (account.plan !== 'builder' && account.plan !== 'maven')) {
      return NextResponse.json({ error: 'Upgrade required' }, { status: 403 });
    }

    const body = await request.json();
    const { enabled, notification_frequency, protected_fields } = body;

    // Validate notification_frequency
    const validFrequencies = ['immediate', 'daily', 'weekly'];
    if (notification_frequency && !validFrequencies.includes(notification_frequency)) {
      return NextResponse.json({ error: 'Invalid notification frequency' }, { status: 400 });
    }

    // Validate protected_fields
    const validFields = ['hours', 'address', 'phone', 'website', 'title', 'description', 'categories'];
    if (protected_fields && !protected_fields.every((f: string) => validFields.includes(f))) {
      return NextResponse.json({ error: 'Invalid protected fields' }, { status: 400 });
    }

    // Upsert settings
    const { data: settings, error } = await supabase
      .from('gbp_protection_settings')
      .upsert({
        account_id: accountId,
        enabled: enabled ?? true,
        notification_frequency: notification_frequency || 'immediate',
        protected_fields: protected_fields || ['hours', 'address', 'phone', 'website', 'title', 'description'],
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'account_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating settings:', error);
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      settings
    });

  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
