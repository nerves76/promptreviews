/**
 * API endpoint to search articles
 *
 * GET /api/docs/search?q=query&limit=10
 */

import { NextResponse } from 'next/server';
import { searchArticles } from '@/lib/docs/articles';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 }
      );
    }

    const articles = await searchArticles(query, limit);

    return NextResponse.json({
      articles,
      total: articles.length,
      query,
      source: 'database'
    });

  } catch (error) {
    console.error('Error in search API:', error);
    return NextResponse.json(
      { error: 'Failed to search articles' },
      { status: 500 }
    );
  }
}
