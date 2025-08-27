/**
 * Critical Success Tracking API
 * Records successful executions of critical functions for error rate calculation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/auth/providers/supabase';
import type { CriticalFunctionSuccess } from '@/utils/criticalFunctionMonitoring';

export async function POST(request: NextRequest) {
  try {
    const success: CriticalFunctionSuccess = await request.json();
    
    const supabase = createClient();
    
    // Store success record
    await supabase
      .from('critical_function_successes')
      .insert({
        function_name: success.functionName,
        user_id: success.userId,
        prompt_page_id: success.promptPageId,
        platform: success.platform,
        duration: success.duration,
        timestamp: success.timestamp,
        additional_context: success.additionalContext
      });
    
    return NextResponse.json({
      success: true,
      message: 'Success recorded'
    });
    
  } catch (err) {
    console.error('Error recording critical success:', err);
    return NextResponse.json(
      { error: 'Failed to record success' },
      { status: 500 }
    );
  }
} 