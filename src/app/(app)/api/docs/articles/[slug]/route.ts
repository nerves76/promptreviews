/**
 * API endpoint to fetch a single article by slug
 *
 * GET /api/docs/articles/[slug]
 *
 * Query params:
 *   - preview: Include draft articles (requires admin)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getArticleBySlug, getArticleBySlugWithDrafts } from '@/lib/docs/articles';

export const revalidate = 300; // 5 minutes

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const searchParams = request.nextUrl.searchParams;
    const preview = searchParams.get('preview') === 'true';

    // Decode slug (may contain URL-encoded slashes)
    const decodedSlug = decodeURIComponent(slug);

    let article;

    if (preview) {
      // Preview mode - include drafts
      // TODO: Add admin authentication check
      article = await getArticleBySlugWithDrafts(decodedSlug);
    } else {
      // Normal mode - only published
      article = await getArticleBySlug(decodedSlug);
    }

    if (!article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      article,
      source: 'database'
    });

  } catch (error) {
    console.error('Error in articles API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch article' },
      { status: 500 }
    );
  }
}
