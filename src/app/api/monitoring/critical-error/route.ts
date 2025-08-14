/**
 * Critical Error Alert API
 * Receives critical function errors and sends immediate alerts
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/auth/providers/supabase';
import type { CriticalFunctionError } from '@/utils/criticalFunctionMonitoring';

// Configure alert thresholds
const ALERT_CONFIG = {
  // Send immediate alert for these critical functions
  IMMEDIATE_ALERT_FUNCTIONS: [
    'ai_generate_review',
    'ai_generate_photo_testimonial', 
    'copy_and_submit',
    'widget_ai_generate',
    'widget_submit'
  ],
  // Send alert if error rate exceeds threshold in time window
  ERROR_RATE_THRESHOLD: 0.1, // 10% error rate
  TIME_WINDOW_MINUTES: 5,
  // Email settings
  ALERT_EMAIL: process.env.ALERT_EMAIL || 'alerts@updates.promptreviews.app',
  // Slack webhook (if configured)
  SLACK_WEBHOOK_URL: process.env.SLACK_ALERT_WEBHOOK_URL,
};

async function sendEmailAlert(error: CriticalFunctionError): Promise<void> {
  try {
    // Use your existing email service or create a simple one
    const emailData = {
      to: ALERT_CONFIG.ALERT_EMAIL,
      subject: `🚨 CRITICAL: ${error.functionName} Failed`,
      html: `
        <h2>🚨 Critical Function Error Alert</h2>
        <p><strong>Function:</strong> ${error.functionName}</p>
        <p><strong>Error:</strong> ${error.errorMessage}</p>
        <p><strong>Time:</strong> ${error.timestamp}</p>
        <p><strong>Page:</strong> ${error.url || 'Unknown'}</p>
        <p><strong>User ID:</strong> ${error.userId || 'Anonymous'}</p>
        <p><strong>Platform:</strong> ${error.platform || 'N/A'}</p>
        <p><strong>Prompt Page ID:</strong> ${error.promptPageId || 'N/A'}</p>
        
        ${error.stack ? `<h3>Stack Trace:</h3><pre>${error.stack}</pre>` : ''}
        
        <h3>Additional Context:</h3>
        <pre>${JSON.stringify(error.additionalContext, null, 2)}</pre>
        
        <p><strong>Action Required:</strong> Investigate immediately - this affects core business functionality.</p>
      `
    };

    // Send via your email service
    await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(emailData)
    });
  } catch (err) {
    console.error('Failed to send email alert:', err);
  }
}

async function sendSlackAlert(error: CriticalFunctionError): Promise<void> {
  if (!ALERT_CONFIG.SLACK_WEBHOOK_URL) return;

  try {
    const slackMessage = {
      text: `🚨 Critical Function Error: ${error.functionName}`,
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "🚨 Critical Function Error Alert"
          }
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*Function:* ${error.functionName}`
            },
            {
              type: "mrkdwn", 
              text: `*Time:* ${error.timestamp}`
            },
            {
              type: "mrkdwn",
              text: `*User:* ${error.userId || 'Anonymous'}`
            },
            {
              type: "mrkdwn",
              text: `*Platform:* ${error.platform || 'N/A'}`
            }
          ]
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Error:* \`${error.errorMessage}\``
          }
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*URL:* ${error.url || 'Unknown'}`
          }
        }
      ]
    };

    await fetch(ALERT_CONFIG.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slackMessage)
    });
  } catch (err) {
    console.error('Failed to send Slack alert:', err);
  }
}

async function storeError(error: CriticalFunctionError): Promise<void> {
  try {
    const supabase = createClient();
    
    await supabase
      .from('critical_function_errors')
      .insert({
        function_name: error.functionName,
        user_id: error.userId,
        prompt_page_id: error.promptPageId,
        platform: error.platform,
        error_message: error.errorMessage,
        stack_trace: error.stack,
        timestamp: error.timestamp,
        user_agent: error.userAgent,
        url: error.url,
        additional_context: error.additionalContext
      });
  } catch (err) {
    console.error('Failed to store error in database:', err);
  }
}

async function checkErrorRate(functionName: string): Promise<boolean> {
  try {
    const supabase = createClient();
    const windowStart = new Date(Date.now() - ALERT_CONFIG.TIME_WINDOW_MINUTES * 60 * 1000);
    
    // Get error count in time window
    const { count: errorCount } = await supabase
      .from('critical_function_errors')
      .select('*', { count: 'exact', head: true })
      .eq('function_name', functionName)
      .gte('timestamp', windowStart.toISOString());
    
    // Get success count in time window
    const { count: successCount } = await supabase
      .from('critical_function_successes')
      .select('*', { count: 'exact', head: true })
      .eq('function_name', functionName)
      .gte('timestamp', windowStart.toISOString());
    
    const totalCalls = (errorCount || 0) + (successCount || 0);
    if (totalCalls === 0) return false;
    
    const errorRate = (errorCount || 0) / totalCalls;
    return errorRate >= ALERT_CONFIG.ERROR_RATE_THRESHOLD;
  } catch (err) {
    console.error('Failed to check error rate:', err);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const error: CriticalFunctionError = await request.json();
    
    // Store error for analysis
    await storeError(error);
    
    // Determine if immediate alert is needed
    const shouldSendImmediateAlert = 
      ALERT_CONFIG.IMMEDIATE_ALERT_FUNCTIONS.includes(error.functionName);
    
    // Check error rate for pattern detection
    const highErrorRate = await checkErrorRate(error.functionName);
    
    // Send alerts if needed
    if (shouldSendImmediateAlert || highErrorRate) {
      console.log(`🚨 Sending critical alert for ${error.functionName}`);
      
      // Send alerts in parallel
      await Promise.allSettled([
        sendEmailAlert(error),
        sendSlackAlert(error)
      ]);
    }
    
    return NextResponse.json({
      success: true,
      alertSent: shouldSendImmediateAlert || highErrorRate,
      message: 'Critical error processed'
    });
    
  } catch (err) {
    console.error('Error processing critical error alert:', err);
    
    // Even if our alerting fails, we should alert about the alerting failure
    try {
      await sendEmailAlert({
        functionName: 'critical_error_endpoint',
        errorMessage: `Failed to process critical error alert: ${err instanceof Error ? err.message : String(err)}`,
        timestamp: new Date().toISOString(),
        url: request.url,
        additionalContext: { originalError: 'See server logs' }
      });
    } catch (alertErr) {
      console.error('Failed to send alert about alerting failure:', alertErr);
    }
    
    return NextResponse.json(
      { error: 'Failed to process critical error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'Critical error monitoring endpoint active',
    config: {
      immediateAlertFunctions: ALERT_CONFIG.IMMEDIATE_ALERT_FUNCTIONS,
      errorRateThreshold: ALERT_CONFIG.ERROR_RATE_THRESHOLD,
      timeWindowMinutes: ALERT_CONFIG.TIME_WINDOW_MINUTES,
      alertEmail: ALERT_CONFIG.ALERT_EMAIL,
      slackConfigured: !!ALERT_CONFIG.SLACK_WEBHOOK_URL
    }
  });
} 