/**
 * API Route: Recent Reviews
 * 
 * Fetches recent reviews for a prompt page with privacy protection and filtering.
 * Only returns reviews if 3+ are available and feature is enabled.
 * Uses initials for privacy and filters out feedback/incomplete reviews.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Helper function to generate initials from names
function generateInitials(firstName?: string, lastName?: string): string {
  const first = firstName?.charAt(0)?.toUpperCase() || '';
  const last = lastName?.charAt(0)?.toUpperCase() || '';
  
  if (first && last) {
    return `${first}.${last}.`;
  } else if (first || last) {
    return `${first || last}.`;
  }
  return 'Anonymous';
}

// Helper function to format relative date
function formatRelativeDate(dateString: string): string {
  const now = new Date();
  const reviewDate = new Date(dateString);
  const diffInDays = Math.floor((now.getTime() - reviewDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) {
    return 'Today';
  } else if (diffInDays === 1) {
    return '1 day ago';
  } else if (diffInDays < 30) {
    return `${diffInDays} days ago`;
  } else if (diffInDays < 365) {
    const months = Math.floor(diffInDays / 30);
    return months === 1 ? '1 month ago' : `${months} months ago`;
  } else {
    const years = Math.floor(diffInDays / 365);
    return years === 1 ? '1 year ago' : `${years} years ago`;
  }
}

export async function GET(
  request: NextRequest,
  context: any
) {
  try {
    const { promptPageId } = await context.params;
    
    if (!promptPageId) {
      return NextResponse.json({ error: 'Missing prompt page ID' }, { status: 400 });
    }

    // DEVELOPMENT MODE BYPASS - Return mock review data
    if (process.env.NODE_ENV === 'development' && promptPageId === '0f1ba885-07d6-4698-9e94-a63d990c65e0') {
      console.log('🔧 DEV MODE: Returning mock recent reviews data');
      const mockReviews = [
        {
          initials: 'S.J.',
          content: 'Exceptional service! The team went above and beyond our expectations. Highly professional and delivered exactly what was promised.',
          platform: 'Google',
          date: '2 days ago'
        },
        {
          initials: 'M.C.',
          content: 'Professional, reliable, and delivered exactly what was promised. Great communication throughout the entire process.',
          platform: 'Website',
          date: '5 days ago'
        },
        {
          initials: 'E.R.',
          content: 'Amazing attention to detail and customer service. Would definitely recommend to anyone looking for quality work.',
          platform: 'Yelp',
          date: '1 week ago'
        },
        {
          initials: 'D.T.',
          content: 'Fast turnaround and excellent quality. Exceeded all expectations and delivered on time.',
          platform: 'Facebook',
          date: '2 weeks ago'
        },
        {
          initials: 'J.W.',
          content: 'Outstanding work! They understood our vision perfectly and brought it to life beautifully.',
          platform: 'Google',
          date: '3 weeks ago'
        }
      ];

      return NextResponse.json({
        hasEnoughReviews: true,
        reviews: mockReviews,
        totalCount: 6
      });
    }

    // Create server-side Supabase client
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // Get prompt page and verify it exists
    const { data: promptPage, error: promptPageError } = await supabase
      .from('prompt_pages')
      .select('id, account_id, recent_reviews_enabled, recent_reviews_scope')
      .eq('id', promptPageId)
      .single();

    if (promptPageError || !promptPage) {
      return NextResponse.json({ error: 'Prompt page not found' }, { status: 404 });
    }

    // Check if feature is enabled for this prompt page
    if (!promptPage.recent_reviews_enabled) {
      return NextResponse.json({
        hasEnoughReviews: false,
        reviews: [],
        message: 'Recent reviews feature not enabled'
      });
    }

    const accountId = promptPage.account_id;
    const reviewScope = promptPage.recent_reviews_scope || 'current_page';

    // Determine which prompt pages to include based on scope
    let promptPageIds: string[];
    
    if (reviewScope === 'all_pages') {
      // Get all prompt pages for this account
      const { data: accountPromptPages, error: pagesError } = await supabase
        .from('prompt_pages')
        .select('id')
        .eq('account_id', accountId);

      if (pagesError || !accountPromptPages) {
        return NextResponse.json({ error: 'Failed to fetch account prompt pages' }, { status: 500 });
      }

      promptPageIds = accountPromptPages.map(page => page.id);
    } else {
      // Only use the current prompt page
      promptPageIds = [promptPageId];
    }
    
    console.log('DEBUG Recent Reviews:', {
      promptPageId,
      accountId,
      reviewScope,
      promptPageIds,
      promptPageIdsCount: promptPageIds.length
    });

    // Count total eligible reviews for this account
    const { count, error: countError } = await supabase
      .from('review_submissions')
      .select('*', { count: 'exact', head: true })
      .in('prompt_page_id', promptPageIds)
      .eq('status', 'submitted')
      .not('review_content', 'is', null)
      .not('review_content', 'eq', '');

    console.log('DEBUG Count Result:', { count, countError });

    if (countError) {
      console.error('Error counting reviews:', countError);
      return NextResponse.json({ error: 'Failed to count reviews' }, { status: 500 });
    }

    // Only proceed if we have 3+ reviews
    if (!count || count < 3) {
      console.log('DEBUG Not enough reviews:', { count, hasEnoughReviews: false });
      return NextResponse.json({
        hasEnoughReviews: false,
        reviews: [],
        message: `Only ${count || 0} reviews available. Need 3+ to show Recent Reviews.`
      });
    }

    // Fetch recent reviews with deduplication
    const { data: reviews, error: reviewsError } = await supabase
      .from('review_submissions')
      .select('first_name, last_name, review_content, platform, created_at')
      .in('prompt_page_id', promptPageIds)
      .eq('status', 'submitted')
      .not('review_content', 'is', null)
      .not('review_content', 'eq', '')
      .order('created_at', { ascending: false })
      .limit(20); // Get more than needed for deduplication

    if (reviewsError) {
      console.error('Error fetching reviews:', reviewsError);
      return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
    }

    // Deduplicate reviews based on name + date combination
    const seenReviews = new Map<string, boolean>();
    const deduplicatedReviews = [];

    for (const review of reviews || []) {
      const dateKey = new Date(review.created_at).toDateString();
      const duplicateKey = `${review.first_name}-${review.last_name}-${dateKey}`;
      
      if (!seenReviews.has(duplicateKey)) {
        seenReviews.set(duplicateKey, true);
        deduplicatedReviews.push(review);
        
        // Stop when we have 5 unique reviews
        if (deduplicatedReviews.length >= 5) {
          break;
        }
      }
    }

    // Format reviews with privacy protection
    const formattedReviews = deduplicatedReviews.map(review => ({
      initials: generateInitials(review.first_name, review.last_name),
      content: review.review_content,
      platform: review.platform || 'Website',
      date: formatRelativeDate(review.created_at)
    }));

    return NextResponse.json({
      hasEnoughReviews: true,
      reviews: formattedReviews,
      totalCount: count
    });

  } catch (error) {
    console.error('Unexpected error in recent-reviews API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 