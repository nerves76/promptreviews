import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminAccess } from '@/lib/admin/permissions';
import { revalidatePath } from 'next/cache';

// Force dynamic rendering and disable caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

export async function GET() {
  try {
    await requireAdminAccess();

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('navigation')
      .select('*')
      .order('parent_id', { ascending: true })
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching navigation items:', error);
      return NextResponse.json({ error: 'Failed to load navigation' }, { status: 500 });
    }

    console.log('[GET Navigation] Returning', data?.length, 'items');

    return NextResponse.json({ items: data ?? [] }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Admin navigation GET error:', error);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireAdminAccess();
    const body = await request.json();

    if (!body.title) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('navigation')
      .insert({
        parent_id: body.parent_id ?? null,
        title: body.title,
        href: body.href ?? null,
        icon_name: body.icon_name ?? null,
        order_index: body.order_index ?? 0,
        visibility: body.visibility && body.visibility.length > 0 ? body.visibility : undefined,
        is_active: body.is_active ?? true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating navigation item:', error);
      return NextResponse.json({ error: 'Failed to create navigation item' }, { status: 500 });
    }

    // Revalidate navigation cache
    revalidatePath('/api/docs/navigation');

    return NextResponse.json({ item: data }, { status: 201 });
  } catch (error) {
    console.error('Admin navigation POST error:', error);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdminAccess();
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('navigation')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating navigation item:', error);
      return NextResponse.json({ error: 'Failed to update navigation item' }, { status: 500 });
    }

    // Revalidate navigation cache
    revalidatePath('/api/docs/navigation');

    return NextResponse.json({ item: data });
  } catch (error) {
    console.error('Admin navigation PUT error:', error);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdminAccess();
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from('navigation')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting navigation item:', error);
      return NextResponse.json({ error: 'Failed to delete navigation item' }, { status: 500 });
    }

    // Revalidate navigation cache
    revalidatePath('/api/docs/navigation');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin navigation DELETE error:', error);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

