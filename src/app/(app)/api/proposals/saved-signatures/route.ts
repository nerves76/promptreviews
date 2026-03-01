/**
 * Saved Signatures API - List and Create
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { validateRequiredString, STRING_LIMITS } from '@/app/(app)/api/utils/validation';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: 'No valid account found' }, { status: 403 });
    }

    const { data: signatures, error } = await supabase
      .from('saved_signatures')
      .select('*')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('[SAVED_SIGNATURES] List error:', error);
      return NextResponse.json({ error: 'Failed to fetch saved signatures' }, { status: 500 });
    }

    // Generate signed URLs for each signature image
    const signaturesWithUrls = await Promise.all(
      (signatures || []).map(async (sig) => {
        if (!sig.signature_image_path) return sig;
        const { data: signedUrlData } = await supabase.storage
          .from('saved-signatures')
          .createSignedUrl(sig.signature_image_path, 3600);
        return {
          ...sig,
          signature_image_url: signedUrlData?.signedUrl || null,
        };
      })
    );

    return NextResponse.json({ signatures: signaturesWithUrls });
  } catch (error) {
    console.error('[SAVED_SIGNATURES] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: 'No valid account found' }, { status: 403 });
    }

    const body = await request.json();

    // Validate name
    const nameError = validateRequiredString(body.name, 'Name', STRING_LIMITS.name);
    if (nameError) {
      return NextResponse.json({ error: nameError }, { status: 400 });
    }

    // Validate signature image
    if (!body.signature_image || typeof body.signature_image !== 'string' || !body.signature_image.startsWith('data:image/png;base64,')) {
      return NextResponse.json({ error: 'Signature image is required (PNG base64 data URL)' }, { status: 400 });
    }

    // Generate a UUID for the new signature
    const signatureId = crypto.randomUUID();

    // Upload signature image to storage using service role client
    const base64Data = body.signature_image.replace('data:image/png;base64,', '');
    const buffer = Buffer.from(base64Data, 'base64');
    const storagePath = `${accountId}/${signatureId}.png`;

    const serviceClient = createServiceRoleClient();
    const { error: uploadError } = await serviceClient.storage
      .from('saved-signatures')
      .upload(storagePath, buffer, {
        contentType: 'image/png',
        upsert: false,
      });

    if (uploadError) {
      console.error('[SAVED_SIGNATURES] Upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to save signature image' }, { status: 500 });
    }

    // Insert row
    const { data: signature, error: createError } = await supabase
      .from('saved_signatures')
      .insert({
        id: signatureId,
        account_id: accountId,
        name: body.name.trim(),
        signature_image_path: storagePath,
      })
      .select()
      .single();

    if (createError) {
      console.error('[SAVED_SIGNATURES] Create error:', createError);
      // Clean up uploaded file
      await serviceClient.storage.from('saved-signatures').remove([storagePath]);
      return NextResponse.json({ error: 'Failed to create saved signature' }, { status: 500 });
    }

    // Generate signed URL for the response
    const { data: signedUrlData } = await supabase.storage
      .from('saved-signatures')
      .createSignedUrl(storagePath, 3600);

    return NextResponse.json(
      { ...signature, signature_image_url: signedUrlData?.signedUrl || null },
      { status: 201 }
    );
  } catch (error) {
    console.error('[SAVED_SIGNATURES] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
