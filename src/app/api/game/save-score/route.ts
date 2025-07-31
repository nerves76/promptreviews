/**
 * Save Game Score API
 * 
 * Saves a player's score to the game leaderboard.
 * This endpoint is public and doesn't require authentication.
 */

import { createClient } from '@/utils/supabaseClient';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { playerName, score, level } = await request.json();

    // Validate input
    if (!playerName || typeof score !== 'number' || typeof level !== 'number') {
      return NextResponse.json(
        { error: 'Invalid input. playerName, score, and level are required.' },
        { status: 400 }
      );
    }

    // Sanitize player name (max 50 characters, alphanumeric and spaces only)
    const sanitizedName = playerName
      .trim()
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .substring(0, 50);

    if (!sanitizedName) {
      return NextResponse.json(
        { error: 'Player name must contain valid characters.' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Insert the score
    const { data, error } = await supabase
      .from('game_leaderboard')
      .insert({
        player_name: sanitizedName,
        score: score,
        level: level
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving score:', error);
      return NextResponse.json(
        { error: 'Failed to save score.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      score: data
    });

  } catch (error) {
    console.error('Error in save-score API:', error);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
} 