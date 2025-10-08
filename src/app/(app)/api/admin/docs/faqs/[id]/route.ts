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

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = await requireAdminAccess();
    const body = await request.json();

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('faqs')
      .update({
        question: body.question,
        answer: body.answer,
        category: body.category,
        plans: body.plans && body.plans.length > 0 ? body.plans : undefined,
        order_index: body.order_index ?? 0,
        article_id: body.article_id ?? null,
        updated_by: userId,
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating FAQ:', error);
      return NextResponse.json({ error: 'Failed to update FAQ' }, { status: 500 });
    }

    return NextResponse.json({ faq: data });
  } catch (error) {
    console.error('Admin FAQ PUT error:', error);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdminAccess();

    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from('faqs')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Error deleting FAQ:', error);
      return NextResponse.json({ error: 'Failed to delete FAQ' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin FAQ DELETE error:', error);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

