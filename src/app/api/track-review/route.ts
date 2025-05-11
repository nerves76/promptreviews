import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export async function POST(request: Request) {
  try {
    const { promptPageId, platform, status } = await request.json();
    const userAgent = request.headers.get('user-agent') || '';
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '';

    const { data, error } = await supabase
      .from('review_submissions')
      .insert({
        prompt_page_id: promptPageId,
        platform,
        status,
        user_agent: userAgent,
        ip_address: ipAddress,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error tracking review:', error);
    return NextResponse.json(
      { error: 'Failed to track review' },
      { status: 500 }
    );
  }
} 