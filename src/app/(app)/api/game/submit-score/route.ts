import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client with service role for database access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Extract client IP address from request headers
 * Checks various headers in order of precedence
 */
function getClientIP(request: NextRequest): string | null {
  // Check Vercel/CF headers first
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // x-forwarded-for can be comma-separated list, take first IP
    return forwardedFor.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  // Fallback to other headers
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const { 
      player_handle, 
      business_name,
      email, 
      website,
      score, 
      level_reached, 
      play_time_seconds,
      game_data 
    } = body;

    // Validation
    if (!player_handle || typeof player_handle !== 'string') {
      return NextResponse.json(
        { error: 'Player handle is required and must be a string' },
        { status: 400 }
      );
    }

    if (player_handle.length < 2 || player_handle.length > 20) {
      return NextResponse.json(
        { error: 'Player handle must be between 2 and 20 characters' },
        { status: 400 }
      );
    }

    // Check for inappropriate content (basic filter)
    const inappropriateWords = ['admin', 'moderator', 'system', 'null', 'undefined'];
    if (inappropriateWords.some(word => player_handle.toLowerCase().includes(word))) {
      return NextResponse.json(
        { error: 'Player handle contains restricted words' },
        { status: 400 }
      );
    }

    if (typeof score !== 'number' || score < 0 || score > 1000000) {
      return NextResponse.json(
        { error: 'Invalid score value' },
        { status: 400 }
      );
    }

    if (typeof level_reached !== 'number' || level_reached < 1 || level_reached > 100) {
      return NextResponse.json(
        { error: 'Invalid level value' },
        { status: 400 }
      );
    }

    // Validate email format if provided
    if (email && typeof email === 'string') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        );
      }
    }

    // Validate business_name if provided
    if (business_name && typeof business_name === 'string') {
      if (business_name.length > 50) {
        return NextResponse.json(
          { error: 'Business name must be 50 characters or less' },
          { status: 400 }
        );
      }
    }

    // Validate website URL format if provided
    if (website && typeof website === 'string') {
      const urlRegex = /^https?:\/\/.+\..+/;
      if (!urlRegex.test(website) || website.length > 255) {
        return NextResponse.json(
          { error: 'Website must be a valid URL starting with http:// or https:// and less than 255 characters' },
          { status: 400 }
        );
      }
    }

    // Capture IP address and user agent for rate limiting and analytics
    const ipAddress = getClientIP(request);
    const userAgent = request.headers.get('user-agent');

    // Insert score into database with security checks enforced by DB triggers
    const { data: insertedScore, error: insertError } = await supabase
      .from('game_scores')
      .insert([
        {
          player_handle: player_handle.trim(),
          business_name: business_name ? business_name.trim() : null,
          email: email ? email.trim().toLowerCase() : null,
          website: website ? website.trim() : null,
          score,
          level_reached,
          play_time_seconds: play_time_seconds || 0,
          game_data: game_data || {},
          ip_address: ipAddress,
          user_agent: userAgent
        }
      ])
      .select('id, player_handle, score, level_reached, created_at')
      .single();

    if (insertError) {
      console.error('Score insertion error:', insertError);

      // Handle specific error types from DB triggers
      // Rate limit errors (SQLSTATE 23P01 - check_violation)
      if (insertError.code === '23P01') {
        return NextResponse.json(
          { error: insertError.message || 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      }

      // Score validation errors (SQLSTATE 23514 - check_violation)
      if (insertError.code === '23514') {
        return NextResponse.json(
          { error: insertError.message || 'Invalid score detected.' },
          { status: 400 }
        );
      }

      // Generic database error
      return NextResponse.json(
        { error: 'Failed to save score' },
        { status: 500 }
      );
    }

    // Get player's rank
    const { data: rankData } = await supabase
      .from('game_scores')
      .select('id')
      .gt('score', score)
      .order('score', { ascending: false });

    const rank = (rankData?.length || 0) + 1;

    // If email provided, this is a lead - you could trigger email campaigns here
    if (email) {
      // TODO: Add to email marketing list, send welcome email, etc.
    }

    return NextResponse.json({
      success: true,
      score_id: insertedScore.id,
      player_handle: insertedScore.player_handle,
      score: insertedScore.score,
      level_reached: insertedScore.level_reached,
      rank,
      message: rank <= 10 ? `Congratulations! You're in the top 10!` : `Great job! You ranked #${rank}.`
    });

  } catch (error) {
    console.error('Submit score API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}