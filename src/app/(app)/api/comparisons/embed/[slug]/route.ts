import { NextRequest, NextResponse } from 'next/server';
import { fetchComparisonData } from '@/app/(embed)/embed/comparison/[slug]/fetchComparisonData';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/**
 * GET /api/comparisons/embed/[slug]
 * Public endpoint to fetch comparison table data for embedding.
 * No authentication required.
 * Now delegates to the shared fetchComparisonData() function.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const data = await fetchComparisonData(slug);

    if (!data) {
      const response = NextResponse.json(
        { error: 'Comparison table not found' },
        { status: 404 }
      );
      setCorsHeaders(response);
      return response;
    }

    const response = NextResponse.json(data);
    setCorsHeaders(response);
    // Cache for 5 minutes on edge
    response.headers.set('Cache-Control', 'public, max-age=300, s-maxage=300');
    return response;
  } catch (error) {
    console.error('Error in GET /api/comparisons/embed/[slug]:', error);
    const response = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
    setCorsHeaders(response);
    return response;
  }
}

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  setCorsHeaders(response);
  return response;
}

/**
 * Set CORS headers for cross-origin embed requests
 */
function setCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}
