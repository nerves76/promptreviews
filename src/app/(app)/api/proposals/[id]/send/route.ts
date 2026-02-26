/**
 * Proposal Send API - Send proposal to client via email
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { isValidUuid } from '@/app/(app)/api/utils/validation';
import { sendResendEmail } from '@/utils/resend';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
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

    // Fetch proposal
    const { data: proposal, error: fetchError } = await supabase
      .from('proposals')
      .select('*')
      .eq('id', id)
      .eq('account_id', accountId)
      .single();

    if (fetchError || !proposal) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    if (!proposal.client_email) {
      return NextResponse.json({ error: 'Client email is required to send' }, { status: 400 });
    }

    // Build email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.promptreviews.app';
    const proposalUrl = `${appUrl}/sow/${proposal.token}`;
    const businessName = proposal.business_name || 'Our team';

    const expirationLine = proposal.expiration_date
      ? `<p style="color: #6b7280; font-size: 14px;">This proposal expires on ${new Date(proposal.expiration_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.</p>`
      : '';

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #111827; margin-bottom: 8px;">Proposal from ${businessName}</h2>
        <p style="color: #4b5563; font-size: 16px; margin-bottom: 4px;">${proposal.title}</p>
        ${expirationLine}
        <div style="margin: 24px 0;">
          <a href="${proposalUrl}" style="display: inline-block; background-color: #2E4A7D; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
            View proposal
          </a>
        </div>
        <p style="color: #9ca3af; font-size: 12px;">
          Sent via <a href="https://promptreviews.app" style="color: #2E4A7D;">Prompt Reviews</a>
        </p>
      </div>
    `;

    await sendResendEmail({
      to: proposal.client_email,
      subject: `Proposal from ${businessName}: ${proposal.title}`,
      html,
    });

    // Update status to sent
    await supabase
      .from('proposals')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('account_id', accountId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[PROPOSALS] Send error:', error);
    return NextResponse.json({ error: 'Failed to send contract' }, { status: 500 });
  }
}
