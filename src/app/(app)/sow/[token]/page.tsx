/**
 * Public Proposal Page - Server Component
 *
 * Fetches proposal + business styling via service role,
 * then passes to client component for rendering.
 * Follows same pattern as survey public page (src/app/(app)/s/[slug]/page.tsx).
 */

import { notFound } from 'next/navigation';
import { createServiceRoleClient, createServerSupabaseClient } from '@/auth/providers/supabase';
import { Metadata } from 'next';
import { GLASSY_DEFAULTS } from '@/app/(app)/config/styleDefaults';
import ProposalPageClient from './page-client';
import { sendNotificationToAccount } from '@/utils/notifications';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params;

  try {
    const supabase = createServiceRoleClient();
    const { data: proposal } = await supabase
      .from('proposals')
      .select('title, business_name')
      .eq('token', token)
      .single();

    if (!proposal) {
      return { title: 'Proposal not found' };
    }

    return {
      title: `${proposal.title} — ${proposal.business_name || 'Proposal'}`,
      robots: 'noindex, nofollow',
    };
  } catch {
    return { title: 'Proposal', robots: 'noindex, nofollow' };
  }
}

async function getProposalData(token: string) {
  try {
    const supabase = createServiceRoleClient();

    const { data: proposal, error } = await supabase
      .from('proposals')
      .select('*')
      .eq('token', token)
      .single();

    if (error || !proposal) {
      return null;
    }

    // Check if expired
    if (proposal.expiration_date && new Date(proposal.expiration_date) < new Date()) {
      if (proposal.status !== 'expired') {
        await supabase
          .from('proposals')
          .update({ status: 'expired', updated_at: new Date().toISOString() })
          .eq('id', proposal.id);
      }
    }

    // Note: "viewed" status tracking is handled in the main function after owner detection
    // so the sender's own preview doesn't trigger "viewed" notification.

    // Fetch signature if exists (include document_hash for owner verification)
    const { data: signature } = await supabase
      .from('proposal_signatures')
      .select('signer_name, signer_email, signed_at, signature_image_url, document_hash')
      .eq('proposal_id', proposal.id)
      .maybeSingle();

    // Generate signed URL for signature image if it exists
    let signatureImageUrl: string | null = null;
    if (signature?.signature_image_url) {
      const { data: signedUrlData } = await supabase.storage
        .from('proposal-signatures')
        .createSignedUrl(signature.signature_image_url, 3600);
      signatureImageUrl = signedUrlData?.signedUrl || null;
    }

    // Fetch business styling and SOW prefix
    let businessProfile = null;
    let sowPrefix: string | null = null;
    if (proposal.account_id) {
      const [{ data: business }, { data: account }] = await Promise.all([
        supabase
          .from('businesses')
          .select('*')
          .eq('account_id', proposal.account_id)
          .maybeSingle(),
        supabase
          .from('accounts')
          .select('sow_prefix')
          .eq('id', proposal.account_id)
          .single(),
      ]);
      businessProfile = business;
      sowPrefix = account?.sow_prefix || null;
    }

    // Build signature data with image URL for client component
    const signatureData = signature
      ? { signer_name: signature.signer_name, signer_email: signature.signer_email, signed_at: signature.signed_at, signature_image_url: signatureImageUrl, document_hash: signature.document_hash || null }
      : null;

    // Fetch sender signature if set
    let senderSignature: { name: string; imageUrl: string } | null = null;
    if (proposal.sender_signature_id) {
      const { data: savedSig } = await supabase
        .from('saved_signatures')
        .select('name, signature_image_path')
        .eq('id', proposal.sender_signature_id)
        .maybeSingle();

      if (savedSig?.signature_image_path) {
        const { data: sigUrl } = await supabase.storage
          .from('saved-signatures')
          .createSignedUrl(savedSig.signature_image_path, 3600);
        if (sigUrl?.signedUrl) {
          senderSignature = { name: savedSig.name, imageUrl: sigUrl.signedUrl };
        }
      }
    }

    return { proposal, signature: signatureData, businessProfile, sowPrefix, senderSignature };
  } catch (error) {
    console.error('Error fetching proposal data:', error);
    return null;
  }
}

export default async function ProposalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const data = await getProposalData(token);

  if (!data) {
    notFound();
  }

  const { proposal, signature, businessProfile, sowPrefix, senderSignature } = data;

  // Detect if the viewer is the authenticated account owner
  let isOwner = false;
  try {
    const authSupabase = await createServerSupabaseClient();
    const { data: { user } } = await authSupabase.auth.getUser();
    if (user && proposal.account_id) {
      const serviceClient = createServiceRoleClient();
      const { data: membership } = await serviceClient
        .from('account_users')
        .select('id')
        .eq('account_id', proposal.account_id)
        .eq('user_id', user.id)
        .maybeSingle();
      isOwner = !!membership;
    }
  } catch {
    // Unauthenticated visitor — isOwner stays false
  }

  // Mark as "viewed" only when a non-owner visits for the first time
  if (!isOwner && proposal.status === 'sent') {
    const supabase = createServiceRoleClient();
    await supabase
      .from('proposals')
      .update({
        status: 'viewed',
        viewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', proposal.id);
    proposal.status = 'viewed';

    // Notify account users that the contract was viewed (fire and forget)
    if (proposal.account_id) {
      const clientName = [proposal.client_first_name, proposal.client_last_name].filter(Boolean).join(' ') || 'Your client';
      sendNotificationToAccount(proposal.account_id, 'proposal_viewed', {
        clientName,
        proposalTitle: proposal.title,
        proposalId: proposal.id,
      }).catch((err: unknown) => console.error('[PROPOSALS] Viewed notification error:', err));
    }
  }

  // DEBUG: Log business profile background values to identify white background issue
  console.log('[SOW-DEBUG] businessProfile exists:', !!businessProfile);
  console.log('[SOW-DEBUG] background_type:', businessProfile?.background_type);
  console.log('[SOW-DEBUG] gradient_start:', businessProfile?.gradient_start);
  console.log('[SOW-DEBUG] gradient_middle:', businessProfile?.gradient_middle);
  console.log('[SOW-DEBUG] gradient_end:', businessProfile?.gradient_end);
  console.log('[SOW-DEBUG] background_color:', businessProfile?.background_color);

  // Build style config from business profile or defaults
  const styleConfig = {
    primaryFont: businessProfile?.primary_font || GLASSY_DEFAULTS.primary_font,
    primaryColor: businessProfile?.primary_color || GLASSY_DEFAULTS.primary_color,
    secondaryColor: businessProfile?.secondary_color || GLASSY_DEFAULTS.secondary_color,
    backgroundType: businessProfile?.background_type || GLASSY_DEFAULTS.background_type,
    backgroundColor: businessProfile?.background_color || GLASSY_DEFAULTS.background_color,
    gradientStart: businessProfile?.gradient_start || GLASSY_DEFAULTS.gradient_start,
    gradientMiddle: businessProfile?.gradient_middle || GLASSY_DEFAULTS.gradient_middle,
    gradientEnd: businessProfile?.gradient_end || GLASSY_DEFAULTS.gradient_end,
    cardBg: businessProfile?.card_bg || GLASSY_DEFAULTS.card_bg,
    cardText: businessProfile?.card_text || GLASSY_DEFAULTS.card_text,
    cardTransparency: businessProfile?.card_transparency ?? GLASSY_DEFAULTS.card_transparency,
    cardBorderWidth: businessProfile?.card_border_width ?? GLASSY_DEFAULTS.card_border_width,
    cardBorderColor: businessProfile?.card_border_color || GLASSY_DEFAULTS.card_border_color,
    cardBorderTransparency: businessProfile?.card_border_transparency ?? GLASSY_DEFAULTS.card_border_transparency,
    cardPlaceholderColor: businessProfile?.card_placeholder_color || GLASSY_DEFAULTS.card_placeholder_color,
    cardInnerShadow: businessProfile?.card_inner_shadow ?? GLASSY_DEFAULTS.card_inner_shadow,
    inputTextColor: businessProfile?.input_text_color || GLASSY_DEFAULTS.input_text_color,
    logoUrl: businessProfile?.logo_url || null,
    businessName: businessProfile?.name || proposal.business_name || null,
    addressCity: businessProfile?.address_city || null,
    addressState: businessProfile?.address_state || null,
  };

  // DEBUG: Compute what getBackground would return
  const debugBg = styleConfig.backgroundType === 'solid'
    ? styleConfig.backgroundColor
    : `linear-gradient(to bottom, ${styleConfig.gradientStart}, ${styleConfig.gradientMiddle}, ${styleConfig.gradientEnd})`;

  return (
    <>
      <ProposalPageClient
        proposal={proposal}
        signature={signature}
        styleConfig={styleConfig}
        token={token}
        sowPrefix={sowPrefix}
        senderSignature={senderSignature}
        isOwner={isOwner}
        proposalId={isOwner ? proposal.id : null}
      />
      {/* DEBUG: Remove after fixing background issue */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#000', color: '#0f0', fontSize: '11px', padding: '4px 8px', zIndex: 9999, fontFamily: 'monospace', opacity: 0.9 }}>
        BG: {debugBg} | type: {styleConfig.backgroundType} | biz: {businessProfile ? 'yes' : 'null'} | start: {styleConfig.gradientStart} | mid: {styleConfig.gradientMiddle} | end: {styleConfig.gradientEnd}
      </div>
    </>
  );
}
