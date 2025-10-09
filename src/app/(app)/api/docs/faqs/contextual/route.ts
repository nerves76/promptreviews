/**
 * API endpoint to fetch contextual FAQs for a route
 *
 * POST /api/docs/faqs/contextual
 *
 * Body:
 *   - route: string (e.g., "/dashboard/prompt-pages", "/dashboard/widget")
 *   - limit: number (optional, default 3)
 *   - userPlan: string (optional, default 'grower')
 */

import { NextRequest, NextResponse } from 'next/server';
import { getContextualFaqs } from '@/lib/docs/faqs';

// No caching for contextual API - responses vary by route parameter
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { route, limit = 3, userPlan = 'grower' } = await request.json();

    if (!route) {
      return NextResponse.json(
        { error: 'Route parameter is required' },
        { status: 400 }
      );
    }

    const faqs = await getContextualFaqs(route, limit, userPlan);

    return NextResponse.json({
      faqs,
      total: faqs.length,
      route,
      source: 'database'
    });

  } catch (error) {
    console.error('Error in contextual FAQs API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contextual FAQs' },
      { status: 500 }
    );
  }
}
