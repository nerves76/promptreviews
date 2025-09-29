/**
 * API endpoint to trigger welcome email for new optimizer leads
 * Called immediately after lead capture
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendWelcomeEmail } from '@/lib/services/optimizerEmailService';

export async function POST(request: NextRequest) {
  try {
    const { leadId } = await request.json();

    if (!leadId) {
      return NextResponse.json(
        { error: 'Lead ID is required' },
        { status: 400 }
      );
    }

    console.log(`Sending welcome email for optimizer lead: ${leadId}`);

    const result = await sendWelcomeEmail(leadId);

    if (result.success) {
      console.log(`✅ Welcome email sent successfully for lead: ${leadId}`);
      return NextResponse.json({ success: true });
    } else {
      console.error(`❌ Failed to send welcome email for lead ${leadId}: ${result.error}`);
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error in send-welcome-email API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}