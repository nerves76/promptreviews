import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminAccess } from '@/lib/admin/permissions';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * POST /api/admin/comparisons/features/reorder
 * Reorder features within a category
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdminAccess();

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await request.json();

    // Expect { categoryId: string, featureIds: string[] }
    const { categoryId, featureIds } = body;

    if (!featureIds || !Array.isArray(featureIds)) {
      return NextResponse.json(
        { error: 'featureIds array is required' },
        { status: 400 }
      );
    }

    // Update display_order for each feature
    const updates = featureIds.map((id, index) =>
      supabase
        .from('comparison_features')
        .update({ display_order: index })
        .eq('id', id)
    );

    await Promise.all(updates);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('Error in POST /api/admin/comparisons/features/reorder:', error);
    return NextResponse.json(
      { error: message },
      { status: message.includes('Unauthorized') ? 401 : message.includes('Forbidden') ? 403 : 500 }
    );
  }
}
