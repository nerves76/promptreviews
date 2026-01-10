/**
 * User Profile API Route
 *
 * GET - Get current user's profile
 * PUT - Update current user's profile (first_name, last_name)
 */

import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createServerSupabaseClient();

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      profile: profile || {
        id: user.id,
        first_name: null,
        last_name: null,
        avatar_url: null,
      },
      email: user.email,
    });
  } catch (error) {
    console.error('Profile GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const supabase = await createServerSupabaseClient();

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { first_name, last_name, avatar_url } = body;

    // Validate input
    if (first_name !== undefined && typeof first_name !== 'string') {
      return NextResponse.json(
        { error: 'Invalid first_name' },
        { status: 400 }
      );
    }
    if (last_name !== undefined && typeof last_name !== 'string') {
      return NextResponse.json(
        { error: 'Invalid last_name' },
        { status: 400 }
      );
    }

    // Upsert profile
    const { data: profile, error: upsertError } = await supabase
      .from('user_profiles')
      .upsert({
        id: user.id,
        first_name: first_name?.trim() || null,
        last_name: last_name?.trim() || null,
        avatar_url: avatar_url || null,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (upsertError) {
      console.error('Error upserting profile:', upsertError);
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      profile,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('Profile PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
