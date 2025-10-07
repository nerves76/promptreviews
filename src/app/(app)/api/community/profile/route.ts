/**
 * Community Profile API
 *
 * GET /api/community/profile - Get or create user's community profile
 * PATCH /api/community/profile - Update profile settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '../utils/auth';
import { createServiceClient } from '../utils/supabase';
import { validateDisplayName } from '../utils/validation';

/**
 * GET /api/community/profile
 * Returns user's community profile, creating one if it doesn't exist
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return authResult.error;
    }

    const { userId } = authResult;
    const supabase = createServiceClient();

    // Try to get existing profile
    const { data: profile } = await supabase
      .from('community_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (profile) {
      return NextResponse.json({ data: profile });
    }

    // No profile exists - generate username and create one
    const { data: username, error: usernameError } = await supabase
      .rpc('generate_username', { p_user_id: userId });

    if (usernameError || !username) {
      console.error('Error generating username:', usernameError);
      return NextResponse.json(
        { error: 'Failed to generate username', code: 'SERVER_ERROR' },
        { status: 500 }
      );
    }

    // Create profile
    const { data: newProfile, error: createError } = await supabase
      .from('community_profiles')
      .insert({
        user_id: userId,
        username: username
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating profile:', createError);
      return NextResponse.json(
        { error: 'Failed to create profile', code: 'SERVER_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: newProfile }, { status: 201 });

  } catch (error) {
    console.error('Profile API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/community/profile
 * Updates user's community profile settings
 */
export async function PATCH(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return authResult.error;
    }

    const { userId } = authResult;

    // Parse request body
    const body = await request.json();

    // Build update object (only allow certain fields)
    const updates: any = {
      updated_at: new Date().toISOString()
    };

    // Validate and set display_name_override
    if (body.display_name_override !== undefined) {
      const validation = validateDisplayName(body.display_name_override);
      if (!validation.isValid) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: validation.errors
          },
          { status: 400 }
        );
      }
      updates.display_name_override = body.display_name_override?.trim() || null;
    }

    // Update profile
    const supabase = createServiceClient();
    const { data: profile, error } = await supabase
      .from('community_profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      return NextResponse.json(
        { error: 'Failed to update profile', code: 'SERVER_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: profile });

  } catch (error) {
    console.error('Profile update API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
