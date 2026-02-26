/**
 * Public Proposal Page - Server Component
 *
 * Fetches proposal + business styling via service role,
 * then passes to client component for rendering.
 * Follows same pattern as survey public page (src/app/(app)/s/[slug]/page.tsx).
 */

import { notFound } from 'next/navigation';
import { createServiceRoleClient } from '@/auth/providers/supabase';
import { Metadata } from 'next';
import { GLASSY_DEFAULTS } from '@/app/(app)/config/styleDefaults';
import ProposalPageClient from './page-client';

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

    // Update to viewed on first access (from sent status)
    if (proposal.status === 'sent') {
      await supabase
        .from('proposals')
        .update({
          status: 'viewed',
          viewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', proposal.id);
      proposal.status = 'viewed';
    }

    // Fetch signature if exists
    const { data: signature } = await supabase
      .from('proposal_signatures')
      .select('signer_name, signer_email, signed_at')
      .eq('proposal_id', proposal.id)
      .maybeSingle();

    // Fetch business styling
    let businessProfile = null;
    if (proposal.account_id) {
      const { data: business } = await supabase
        .from('businesses')
        .select('*')
        .eq('account_id', proposal.account_id)
        .maybeSingle();
      businessProfile = business;
    }

    return { proposal, signature, businessProfile };
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

  const { proposal, signature, businessProfile } = data;

  // Build style config from business profile or defaults
  const styleConfig = {
    primaryFont: businessProfile?.primary_font || GLASSY_DEFAULTS.primary_font,
    primaryColor: businessProfile?.primary_color || GLASSY_DEFAULTS.primary_color,
    secondaryColor: businessProfile?.secondary_color || GLASSY_DEFAULTS.secondary_color,
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
  };

  return (
    <ProposalPageClient
      proposal={proposal}
      signature={signature}
      styleConfig={styleConfig}
      token={token}
    />
  );
}
