import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminAccess } from '@/lib/admin/permissions';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getSupabaseAdmin() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    await requireAdminAccess();

    const { searchParams } = new URL(request.url);
    const plan = searchParams.get('plan');
    const category = searchParams.get('category');

    const supabase = getSupabaseAdmin();
    let query = supabase
      .from('faqs')
      .select('*')
      .order('category')
      .order('order_index');

    if (plan) {
      query = query.contains('plans', [plan]);
    }

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching admin FAQs:', error);
      return NextResponse.json({ error: 'Failed to load FAQs' }, { status: 500 });
    }

    return NextResponse.json({ faqs: data ?? [] });
  } catch (error) {
    console.error('Admin FAQ GET error:', error);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireAdminAccess();
    const body = await request.json();

    if (!body.question || !body.answer || !body.category) {
      return NextResponse.json(
        { error: 'question, answer, and category are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('faqs')
      .insert({
        question: body.question,
        answer: body.answer,
        category: body.category,
        plans: body.plans && body.plans.length > 0 ? body.plans : undefined,
        order_index: body.order_index ?? 0,
        article_id: body.article_id ?? null,
        created_by: userId,
        updated_by: userId,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating FAQ:', error);
      return NextResponse.json({ error: 'Failed to create FAQ' }, { status: 500 });
    }

    return NextResponse.json({ faq: data }, { status: 201 });
  } catch (error) {
    console.error('Admin FAQ POST error:', error);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

