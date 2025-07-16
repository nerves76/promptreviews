/**
 * Critical Function Monitoring
 * Enhanced error tracking and alerting for business-critical functionality
 */

// Types for critical function monitoring
export interface CriticalFunctionError {
  functionName: string;
  userId?: string;
  promptPageId?: string;
  platform?: string;
  errorMessage: string;
  stack?: string;
  timestamp: string;
  userAgent?: string;
  url?: string;
  additionalContext?: Record<string, any>;
}

export interface CriticalFunctionSuccess {
  functionName: string;
  userId?: string;
  promptPageId?: string;
  platform?: string;
  duration: number;
  timestamp: string;
  additionalContext?: Record<string, any>;
}

// Critical function names for tracking
export const CRITICAL_FUNCTIONS = {
  AI_GENERATE_REVIEW: 'ai_generate_review',
  AI_GENERATE_PHOTO_TESTIMONIAL: 'ai_generate_photo_testimonial',
  COPY_AND_SUBMIT: 'copy_and_submit',
  TRACK_REVIEW: 'track_review',
  CLIPBOARD_COPY: 'clipboard_copy',
  WIDGET_AI_GENERATE: 'widget_ai_generate',
  WIDGET_SUBMIT: 'widget_submit'
} as const;

type CriticalFunction = typeof CRITICAL_FUNCTIONS[keyof typeof CRITICAL_FUNCTIONS];

/**
 * Send critical error to multiple monitoring services
 */
async function sendCriticalError(error: CriticalFunctionError): Promise<void> {
  // Send to Sentry if available
  if (typeof window !== 'undefined' && (window as any).Sentry) {
    (window as any).Sentry.captureException(new Error(error.errorMessage), {
      tags: {
        critical_function: error.functionName,
        business_critical: true,
        alert_level: 'high'
      },
      contexts: {
        critical_error: {
          function: error.functionName,
          platform: error.platform,
          promptPageId: error.promptPageId,
          timestamp: error.timestamp,
          ...error.additionalContext
        }
      },
      user: error.userId ? { id: error.userId } : undefined
    });
  }

  // Send to our custom alerting endpoint
  try {
    await fetch('/api/monitoring/critical-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(error)
    });
  } catch (err) {
    console.error('Failed to send critical error alert:', err);
  }

  // Log to console for development
  console.error('🚨 CRITICAL FUNCTION ERROR:', error);
}

/**
 * Track successful critical function execution
 */
async function trackCriticalSuccess(success: CriticalFunctionSuccess): Promise<void> {
  try {
    await fetch('/api/monitoring/critical-success', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(success)
    });
  } catch (err) {
    console.error('Failed to track critical success:', err);
  }
}

/**
 * Wrapper for critical functions with comprehensive monitoring
 */
export async function monitorCriticalFunction<T>(
  functionName: CriticalFunction,
  fn: () => Promise<T>,
  context: {
    userId?: string;
    promptPageId?: string;
    platform?: string;
    additionalContext?: Record<string, any>;
  } = {}
): Promise<T> {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  
  try {
    const result = await fn();
    
    // Track successful execution
    await trackCriticalSuccess({
      functionName,
      duration: Date.now() - startTime,
      timestamp,
      ...context
    });
    
    return result;
  } catch (error) {
    // Send detailed error information
    await sendCriticalError({
      functionName,
      errorMessage: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      ...context
    });
    
    throw error; // Re-throw to maintain original behavior
  }
}

/**
 * Monitor clipboard operations specifically
 */
export async function monitorClipboardOperation(
  text: string,
  context: {
    userId?: string;
    promptPageId?: string;
    platform?: string;
  } = {}
): Promise<boolean> {
  return monitorCriticalFunction(
    CRITICAL_FUNCTIONS.CLIPBOARD_COPY,
    async () => {
      if (!navigator.clipboard) {
        throw new Error('Clipboard API not available');
      }
      
      await navigator.clipboard.writeText(text);
      return true;
    },
    {
      ...context,
      additionalContext: {
        textLength: text.length,
        hasClipboardAPI: !!navigator.clipboard
      }
    }
  );
}

/**
 * Monitor API requests to critical endpoints
 */
export async function monitorCriticalAPIRequest<T>(
  functionName: CriticalFunction,
  url: string,
  options: RequestInit,
  context: {
    userId?: string;
    promptPageId?: string;
    platform?: string;
    additionalContext?: Record<string, any>;
  } = {}
): Promise<T> {
  return monitorCriticalFunction(
    functionName,
    async () => {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data || (url.includes('generate-review') && !data.text)) {
        throw new Error('API returned invalid response data');
      }
      
      return data;
    },
    {
      ...context,
      additionalContext: {
        endpoint: url,
        method: options.method || 'GET',
        ...context.additionalContext
      }
    }
  );
}

/**
 * Health check for critical functionality
 */
export async function performCriticalHealthCheck(): Promise<{
  status: 'healthy' | 'degraded' | 'critical';
  checks: Record<string, { status: 'pass' | 'fail'; message?: string; duration?: number }>;
}> {
  const checks: Record<string, { status: 'pass' | 'fail'; message?: string; duration?: number }> = {};
  
  // Test AI generation endpoint
  try {
    const start = Date.now();
    const response = await fetch('/api/health/ai-generation', { method: 'GET' });
    checks.ai_generation = {
      status: response.ok ? 'pass' : 'fail',
      duration: Date.now() - start,
      message: response.ok ? undefined : `HTTP ${response.status}`
    };
  } catch (error) {
    checks.ai_generation = {
      status: 'fail',
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
  
  // Test review tracking endpoint
  try {
    const start = Date.now();
    const response = await fetch('/api/health/review-tracking', { method: 'GET' });
    checks.review_tracking = {
      status: response.ok ? 'pass' : 'fail',
      duration: Date.now() - start,
      message: response.ok ? undefined : `HTTP ${response.status}`
    };
  } catch (error) {
    checks.review_tracking = {
      status: 'fail',
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
  
  // Test clipboard API availability
  checks.clipboard_api = {
    status: (typeof navigator !== 'undefined' && navigator.clipboard) ? 'pass' : 'fail',
    message: (typeof navigator !== 'undefined' && navigator.clipboard) ? undefined : 'Clipboard API not available'
  };
  
  // Determine overall status
  const failedChecks = Object.values(checks).filter(check => check.status === 'fail').length;
  const status = failedChecks === 0 ? 'healthy' : failedChecks >= 2 ? 'critical' : 'degraded';
  
  return { status, checks };
} 