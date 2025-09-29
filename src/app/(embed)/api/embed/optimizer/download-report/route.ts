import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/services/optimizerLeadService';
import { OptimizerReportGenerator, createSampleAnalysisData, type BusinessData, type AnalysisData } from '@/lib/services/optimizerReportGenerator';
import { createClient } from '@supabase/supabase-js';

interface SessionScope {
  businessName?: string;
  googleMapsUrl?: string;
  companySize?: string;
  industry?: string;
}

function getSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Supabase service role credentials are required');
  }

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function POST(request: NextRequest) {
  try {
    // Get session token from header
    const sessionToken = request.headers.get('x-session-token');
    if (!sessionToken) {
      return NextResponse.json({ error: 'Session token required' }, { status: 401 });
    }

    // Validate session
    const sessionData = await validateSession(sessionToken);
    if (!sessionData.email) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Extract business data from session scope
    const scope = sessionData.payload.scope as SessionScope || {};
    const businessData: BusinessData = {
      businessName: scope.businessName || 'Your Business',
      industry: scope.industry || 'Business',
      companySize: scope.companySize || 'Not specified',
      googleMapsUrl: scope.googleMapsUrl || '',
      email: sessionData.email
    };

    // For now, use sample analysis data
    // In the future, this would integrate with Google Business Profile API
    const analysisData: AnalysisData = createSampleAnalysisData();

    // Generate PDF report
    const reportGenerator = new OptimizerReportGenerator();
    const pdfBuffer = reportGenerator.generateReport(businessData, analysisData);

    // Update lead record with PDF download info
    if (sessionData.leadId) {
      const supabase = getSupabaseAdminClient();
      const downloadDate = new Date().toISOString();

      const { error: updateError } = await supabase
        .from('optimizer_leads')
        .update({
          pdf_downloaded: true,
          pdf_download_date: downloadDate,
          last_analysis_date: downloadDate
        })
        .eq('id', sessionData.leadId);

      if (updateError) {
        console.error('Failed to update lead record:', updateError);
        // Don't fail the request if this fails, just log it
      } else {
        // Trigger conversion tracking (async, don't wait)
        try {
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.promptreviews.app';
          fetch(`${baseUrl}/api/optimizer/update-conversion`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              leadId: sessionData.leadId,
              pdf_downloaded: true,
              pdf_download_date: downloadDate
            }),
          }).catch(error => {
            console.error(`Failed to track PDF download conversion for lead ${sessionData.leadId}:`, error);
          });
        } catch (error) {
          console.error(`Error tracking PDF download conversion for lead ${sessionData.leadId}:`, error);
        }
      }
    }

    // Generate filename
    const businessName = businessData.businessName.replace(/[^a-zA-Z0-9]/g, '_');
    const date = new Date().toISOString().split('T')[0];
    const filename = `Google_Business_Report_${businessName}_${date}.pdf`;

    // Return PDF file
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.byteLength.toString(),
      },
    });

  } catch (error) {
    console.error('Error generating PDF report:', error);

    // Return different error messages based on the error type
    if (error instanceof Error) {
      if (error.message.includes('Session token expired')) {
        return NextResponse.json({ error: 'Session expired. Please refresh and try again.' }, { status: 401 });
      }
      if (error.message.includes('Session not found')) {
        return NextResponse.json({ error: 'Invalid session. Please refresh and try again.' }, { status: 401 });
      }
    }

    return NextResponse.json({
      error: 'Failed to generate report. Please try again later.'
    }, { status: 500 });
  }
}