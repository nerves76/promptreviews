/**
 * API endpoint to fetch contextual articles for a route
 *
 * POST /api/docs/contextual
 *
 * Body:
 *   - route: string (e.g., "/dashboard/prompt-pages")
 *   - limit: number (optional, default 6)
 *   - userPlan: string (optional, for plan-based filtering)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getContextualArticles, filterArticlesByPlan } from '@/lib/docs/articles';

export const revalidate = 300; // 5 minutes

export async function POST(request: NextRequest) {
  try {
    const { route, limit = 6, userPlan } = await request.json();

    if (!route) {
      return NextResponse.json(
        { error: 'Route parameter is required' },
        { status: 400 }
      );
    }

    let articles = await getContextualArticles(route, limit);

    // Filter by plan if provided
    if (userPlan) {
      articles = filterArticlesByPlan(articles, userPlan);
    }

    return NextResponse.json({
      articles,
      total: articles.length,
      route,
      source: 'database'
    });

  } catch (error) {
    console.error('Error in contextual articles API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contextual articles' },
      { status: 500 }
    );
  }
}
