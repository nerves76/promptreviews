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
    await requireAdminAccess();
    const body = await request.json();

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('navigation')
      .update({
        parent_id: body.parent_id ?? null,
        title: body.title,
        href: body.href ?? null,
        icon_name: body.icon_name ?? null,
        order_index: body.order_index ?? 0,
        visibility: body.visibility && body.visibility.length > 0 ? body.visibility : undefined,
        is_active: body.is_active ?? true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating navigation item:', error);
      return NextResponse.json({ error: 'Failed to update navigation item' }, { status: 500 });
    }

    return NextResponse.json({ item: data });
  } catch (error) {
    console.error('Admin navigation PUT error:', error);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdminAccess();
    const supabase = getSupabaseAdmin();

    const { error } = await supabase
      .from('navigation')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Error deleting navigation item:', error);
      return NextResponse.json({ error: 'Failed to delete navigation item' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin navigation DELETE error:', error);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

