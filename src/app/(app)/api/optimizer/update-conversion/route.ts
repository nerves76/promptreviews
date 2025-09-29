/**
 * API endpoint to update lead conversion status
 * Used to track PDF downloads, trial signups, and customer conversions
 */

import { NextRequest, NextResponse } from 'next/server';
import { updateLeadConversionStatus } from '@/lib/services/optimizerEmailService';

export async function POST(request: NextRequest) {
  try {
    const { leadId, ...updates } = await request.json();

    if (!leadId) {
      return NextResponse.json(
        { error: 'Lead ID is required' },
        { status: 400 }
      );
    }

    // Validate the updates object contains valid fields
    const validFields = [
      'pdf_downloaded',
      'pdf_download_date',
      'signed_up_for_trial',
      'trial_start_date',
      'converted_to_customer',
      'customer_conversion_date'
    ];

    const validUpdates = Object.keys(updates).every(key => validFields.includes(key));
    if (!validUpdates) {
      return NextResponse.json(
        { error: 'Invalid update fields provided' },
        { status: 400 }
      );
    }

    console.log(`Updating conversion status for optimizer lead: ${leadId}`, updates);

    const result = await updateLeadConversionStatus(leadId, updates);

    if (result.success) {
      console.log(`✅ Conversion status updated for lead: ${leadId}`);
      return NextResponse.json({ success: true });
    } else {
      console.error(`❌ Failed to update conversion status for lead ${leadId}: ${result.error}`);
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error in update-conversion API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}