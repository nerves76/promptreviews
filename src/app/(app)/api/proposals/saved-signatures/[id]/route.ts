/**
 * Saved Signatures API - Delete single signature
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { isValidUuid } from '@/app/(app)/api/utils/validation';

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    if (!isValidUuid(id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: 'No valid account found' }, { status: 403 });
    }

    // Fetch the signature to get the storage path before deleting
    const { data: signature } = await supabase
      .from('saved_signatures')
      .select('signature_image_path')
      .eq('id', id)
      .eq('account_id', accountId)
      .single();

    if (!signature) {
      return NextResponse.json({ error: 'Signature not found' }, { status: 404 });
    }

    // Delete the storage object
    if (signature.signature_image_path) {
      const serviceClient = createServiceRoleClient();
      await serviceClient.storage
        .from('saved-signatures')
        .remove([signature.signature_image_path]);
    }

    // Delete the DB row
    const { error } = await supabase
      .from('saved_signatures')
      .delete()
      .eq('id', id)
      .eq('account_id', accountId);

    if (error) {
      console.error('[SAVED_SIGNATURES] Delete error:', error);
      return NextResponse.json({ error: 'Failed to delete saved signature' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[SAVED_SIGNATURES] DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
