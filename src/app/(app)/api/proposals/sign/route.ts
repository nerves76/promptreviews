/**
 * Proposal Sign API - Submit signature (no auth required, service role)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { createServiceRoleClient } from '@/auth/providers/supabase';
import { sendNotificationToAccount } from '@/utils/notifications';
import { validateRequiredString, STRING_LIMITS } from '@/app/(app)/api/utils/validation';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, signer_name, signer_email, signature_image, accepted_terms } = body;

    // Validate inputs
    if (!token || typeof token !== 'string' || token.length !== 64) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
    }

    const nameError = validateRequiredString(signer_name, 'Name', STRING_LIMITS.name);
    if (nameError) return NextResponse.json({ error: nameError }, { status: 400 });

    if (!signer_email || !EMAIL_REGEX.test(signer_email.trim())) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    if (!signature_image || typeof signature_image !== 'string' || !signature_image.startsWith('data:image/png;base64,')) {
      return NextResponse.json({ error: 'Signature image is required' }, { status: 400 });
    }

    if (!accepted_terms) {
      return NextResponse.json({ error: 'You must accept the terms to sign' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    // Fetch proposal
    const { data: proposal, error: fetchError } = await supabase
      .from('proposals')
      .select('*')
      .eq('token', token)
      .single();

    if (fetchError || !proposal) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    // Check if already signed
    const { data: existingSig } = await supabase
      .from('proposal_signatures')
      .select('id')
      .eq('proposal_id', proposal.id)
      .maybeSingle();

    if (existingSig) {
      return NextResponse.json({ error: 'This contract has already been signed' }, { status: 400 });
    }

    // Check if expired
    if (proposal.expiration_date && new Date(proposal.expiration_date) < new Date()) {
      return NextResponse.json({ error: 'This proposal has expired' }, { status: 410 });
    }

    // Generate document hash
    const content = JSON.stringify({
      title: proposal.title,
      custom_sections: proposal.custom_sections,
      line_items: proposal.line_items,
      terms_content: proposal.terms_content,
      client_first_name: proposal.client_first_name,
      client_last_name: proposal.client_last_name,
      client_email: proposal.client_email,
      discount_type: proposal.discount_type ?? null,
      discount_value: proposal.discount_value ?? 0,
      tax_rate: proposal.tax_rate ?? 0,
    });
    const documentHash = createHash('sha256').update(content).digest('hex');

    // Upload signature image to storage
    const base64Data = signature_image.replace('data:image/png;base64,', '');
    const buffer = Buffer.from(base64Data, 'base64');
    const storagePath = `${proposal.account_id}/${proposal.id}.png`;

    const { error: uploadError } = await supabase.storage
      .from('proposal-signatures')
      .upload(storagePath, buffer, {
        contentType: 'image/png',
        upsert: true,
      });

    if (uploadError) {
      console.error('[PROPOSALS] Signature upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to save signature' }, { status: 500 });
    }

    // Get client IP and user agent
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null;
    const userAgent = request.headers.get('user-agent') || null;

    // Create signature record
    const { error: sigError } = await supabase
      .from('proposal_signatures')
      .insert({
        proposal_id: proposal.id,
        account_id: proposal.account_id,
        signer_name: signer_name.trim(),
        signer_email: signer_email.trim(),
        signature_image_url: storagePath,
        ip_address: ipAddress,
        user_agent: userAgent,
        document_hash: documentHash,
        accepted_terms: true,
      });

    if (sigError) {
      console.error('[PROPOSALS] Signature record error:', sigError);
      return NextResponse.json({ error: 'Failed to save signature' }, { status: 500 });
    }

    // Update proposal status
    await supabase
      .from('proposals')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', proposal.id);

    // Send signed notification via notification system (in-app + templated email)
    if (proposal.account_id) {
      sendNotificationToAccount(proposal.account_id, 'proposal_signed', {
        signerName: signer_name.trim(),
        signerEmail: signer_email.trim(),
        proposalTitle: proposal.title,
        proposalId: proposal.id,
        signedAt: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      }).catch((err) => console.error('[PROPOSALS] Signed notification error:', err));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[PROPOSALS] Sign error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
