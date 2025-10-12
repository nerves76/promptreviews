import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminAccess } from '@/lib/admin/permissions';
import { revalidatePath } from 'next/cache';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/admin/help-content
 * List all articles with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    await requireAdminAccess();

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { searchParams } = new URL(request.url);

    // Extract query parameters
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    // Build query
    let query = supabase
      .from('articles')
      .select('*')
      .order('updated_at', { ascending: false });

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (category && category !== 'all') {
      query = query.eq('metadata->>category', category);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,slug.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching articles:', error);
      return NextResponse.json(
        { error: 'Failed to fetch articles' },
        { status: 500 }
      );
    }

    // Calculate stats
    const stats = {
      total: data.length,
      published: data.filter((a) => a.status === 'published').length,
      draft: data.filter((a) => a.status === 'draft').length,
      archived: data.filter((a) => a.status === 'archived').length,
    };

    return NextResponse.json({ articles: data, stats });
  } catch (error: any) {
    console.error('Error in GET /api/admin/help-content:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message?.includes('Unauthorized') ? 401 : error.message?.includes('Forbidden') ? 403 : 500 }
    );
  }
}

/**
 * POST /api/admin/help-content
 * Create a new article
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    await requireAdminAccess();

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await request.json();

    // Validate required fields
    if (!body.title || !body.slug || !body.content) {
      return NextResponse.json(
        { error: 'Missing required fields: title, slug, content' },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const { data: existing } = await supabase
      .from('articles')
      .select('slug')
      .eq('slug', body.slug)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'An article with this slug already exists' },
        { status: 409 }
      );
    }

    // Create article
    const { data, error } = await supabase
      .from('articles')
      .insert({
        title: body.title,
        slug: body.slug,
        content: body.content,
        metadata: body.metadata || {},
        status: body.status || 'draft',
        published_at: body.status === 'published' ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating article:', error);
      return NextResponse.json(
        { error: 'Failed to create article' },
        { status: 500 }
      );
    }

    // Sync FAQs to global table if requested
    if (body.metadata?.faqs && Array.isArray(body.metadata.faqs)) {
      const userId = await requireAdminAccess(); // Get admin user ID

      for (const faq of body.metadata.faqs) {
        if (faq.addToGlobalFaqs && faq.question && faq.answer) {
          // Insert new global FAQ
          await supabase
            .from('faqs')
            .insert({
              question: faq.question,
              answer: faq.answer,
              category: body.metadata.category || 'general',
              plans: ['grower', 'builder', 'maven', 'enterprise'],
              order_index: 0,
              article_id: data.id,
              created_by: userId,
              updated_by: userId,
            });
        }
      }
    }

    // Revalidate docs cache to include new article in navigation
    revalidatePath('/api/docs/navigation');
    revalidatePath(`/api/docs/articles/${body.slug}`);

    return NextResponse.json({ article: data }, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/admin/help-content:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message?.includes('Unauthorized') ? 401 : error.message?.includes('Forbidden') ? 403 : 500 }
    );
  }
}
