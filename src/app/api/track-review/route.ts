import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';
import { sendReviewNotificationEmail } from '@/utils/mailgun';

export async function POST(request: Request) {
  try {
    const {
      promptPageId,
      platform,
      status,
      first_name,
      last_name,
      reviewContent,
      promptPageType,
      review_type,
      sentiment,
      email,
      phone
    } = await request.json();
    const userAgent = request.headers.get('user-agent') || '';
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '';

    const { data, error } = await supabase
      .from('review_submissions')
      .insert({
        prompt_page_id: promptPageId,
        platform,
        status,
        first_name,
        last_name,
        review_content: reviewContent,
        prompt_page_type: promptPageType,
        review_type: review_type || (status === 'feedback' ? 'feedback' : 'review'),
        sentiment: sentiment,
        email: email,
        phone: phone,
        user_agent: userAgent,
        ip_address: ipAddress,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    const { data: promptPage } = await supabase
      .from('prompt_pages')
      .select('account_id')
      .eq('id', promptPageId)
      .single();

    if (promptPage && promptPage.account_id) {
      const { data: account } = await supabase
        .from('accounts')
        .select('email, review_notifications_enabled, first_name')
        .eq('id', promptPage.account_id)
        .single();

      if (account?.review_notifications_enabled && account?.email) {
        const reviewerFullName = [first_name, last_name].filter(Boolean).join(' ') || 'A reviewer';
        await sendReviewNotificationEmail(
          account.email,
          reviewerFullName,
          platform,
          reviewContent || '(No review text provided)',
          review_type || (status === 'feedback' ? 'feedback' : 'review'),
          account.first_name || undefined
        );
      }
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error tracking review:', error, JSON.stringify(error, null, 2));
    if (typeof error === 'object' && error !== null) {
      if ('message' in error) {
        console.error('Error message:', (error as any).message);
      }
      if ('details' in error) {
        console.error('Error details:', (error as any).details);
      }
      if ('response' in error && typeof (error as any).response.text === 'function') {
        (error as any).response.text().then((text: string) => {
          console.error('Error response text:', text);
        });
      }
    }
    return NextResponse.json(
      { error: 'Failed to track review' },
      { status: 500 }
    );
  }
} 