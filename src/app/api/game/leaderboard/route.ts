import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client with service role for database access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100); // Max 100, default 10

    // Get top scores from public view
    const { data: scores, error } = await supabase
      .from('public_leaderboard')
      .select('player_handle, business_name, score, level_reached, created_at, email_domain, website')
      .limit(limit);

    if (error) {
      console.error('Leaderboard fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch leaderboard' },
        { status: 500 }
      );
    }

    // Format the response
    const leaderboard = scores?.map((score, index) => ({
      rank: index + 1,
      player_handle: score.player_handle,
      business_name: score.business_name,
      score: score.score,
      level_reached: score.level_reached,
      website: score.website,
      email_domain: score.email_domain,
      created_at: score.created_at,
      // Add some fun rank titles
      title: getRankTitle(index + 1)
    })) || [];

    return NextResponse.json({
      success: true,
      leaderboard,
      total_count: scores?.length || 0
    });

  } catch (error) {
    console.error('Leaderboard API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getRankTitle(rank: number): string {
  switch (rank) {
    case 1: return '👑 Authority King/Queen';
    case 2: return '🥈 Review Master';
    case 3: return '🥉 Customer Whisperer';
    case 4:
    case 5: return '⭐ Rising Star';
    case 6:
    case 7:
    case 8:
    case 9:
    case 10: return '🚀 Power Player';
    default: return '💪 Challenger';
  }
}