import { NextRequest, NextResponse } from 'next/server';
import { getFaqs } from '@/lib/docs/faqs';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const plan = searchParams.get('plan') ?? undefined;
    const category = searchParams.get('category') ?? undefined;
    const search = searchParams.get('search') ?? undefined;
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined;

    const faqs = await getFaqs({ plan, category, search, limit });

    return NextResponse.json({
      faqs,
      total: faqs.length,
    });
  } catch (error) {
    console.error('Error fetching docs FAQs:', error);
    return NextResponse.json({ error: 'Failed to load FAQs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { plan, category, search, limit, contextKeywords } = body ?? {};

    const faqs = await getFaqs({
      plan,
      category,
      search,
      limit,
      contextKeywords,
    });

    return NextResponse.json({
      faqs,
      total: faqs.length,
    });
  } catch (error) {
    console.error('Error fetching docs FAQs:', error);
    return NextResponse.json({ error: 'Failed to load FAQs' }, { status: 500 });
  }
}

