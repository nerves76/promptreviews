/**
 * Get Game Leaderboard API
 * 
 * Retrieves the top scores from the game leaderboard.
 * This endpoint is public and doesn't require authentication.
 */

import { createClient } from '@/utils/supabaseClient';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Validate parameters
    if (limit > 1000 || limit < 1) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 1000.' },
        { status: 400 }
      );
    }

    if (offset < 0) {
      return NextResponse.json(
        { error: 'Offset must be non-negative.' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Get top scores ordered by score descending, then by created_at for ties
    const { data, error } = await supabase
      .from('game_leaderboard')
      .select('*')
      .order('score', { ascending: false })
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching leaderboard:', error);
      return NextResponse.json(
        { error: 'Failed to fetch leaderboard.' },
        { status: 500 }
      );
    }

    // Add rank to each score
    const leaderboard = data.map((score, index) => ({
      ...score,
      rank: offset + index + 1
    }));

    return NextResponse.json({
      success: true,
      leaderboard,
      total: leaderboard.length,
      limit,
      offset
    });

  } catch (error) {
    console.error('Error in leaderboard API:', error);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
} 