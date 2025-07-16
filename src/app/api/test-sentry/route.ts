/**
 * Test API route for Sentry integration
 * This route allows testing Sentry error reporting
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Skip Sentry operations in development or when disabled
    if (process.env.DISABLE_SENTRY === 'true' || process.env.NODE_ENV === 'development') {
      return NextResponse.json({ 
        message: 'Sentry testing skipped in development mode',
        environment: process.env.NODE_ENV,
        sentryDisabled: process.env.DISABLE_SENTRY === 'true'
      });
    }

    // Dynamic import to prevent loading Sentry in disabled environments
    const Sentry = await import('@sentry/nextjs');

    // Add breadcrumb for tracking
    Sentry.addBreadcrumb({
      message: 'Test API route accessed',
      category: 'api',
      level: 'info',
    });

    // Test error capture
    const testError = new Error('This is a test error for Sentry');
    Sentry.captureException(testError, {
      tags: {
        test: 'true',
        route: '/api/test-sentry',
      },
      contexts: {
        test: {
          purpose: 'Sentry integration testing',
          timestamp: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Sentry test error captured successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // Try to capture error with Sentry if available
    try {
      const Sentry = await import('@sentry/nextjs');
      Sentry.captureException(error, {
        tags: {
          test: 'true',
          route: '/api/test-sentry',
          errorType: 'unexpected',
        },
      });
    } catch (sentryError) {
      console.error('Failed to capture error with Sentry:', sentryError);
    }

    return NextResponse.json(
      { error: 'Test failed' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Skip Sentry operations in development or when disabled
    if (process.env.DISABLE_SENTRY === 'true' || process.env.NODE_ENV === 'development') {
      return NextResponse.json({ 
        message: 'Sentry testing skipped in development mode',
        environment: process.env.NODE_ENV,
        sentryDisabled: process.env.DISABLE_SENTRY === 'true'
      });
    }

    const body = await request.json();
    
    // Dynamic import to prevent loading Sentry in disabled environments
    const Sentry = await import('@sentry/nextjs');
    
    // Test message capture
    Sentry.captureMessage('Test message from API', {
      level: 'info',
      contexts: {
        test: {
          body,
          method: 'POST',
          route: '/api/test-sentry',
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Sentry test message captured successfully',
      data: body,
    });
  } catch (error) {
    // Try to capture error with Sentry if available
    try {
      const Sentry = await import('@sentry/nextjs');
      Sentry.captureException(error, {
        tags: {
          test: 'true',
          route: '/api/test-sentry',
          method: 'POST',
        },
      });
    } catch (sentryError) {
      console.error('Failed to capture error with Sentry:', sentryError);
    }

    return NextResponse.json(
      { error: 'Test failed' },
      { status: 500 }
    );
  }
} 