/**
 * Review Tracking Health Check
 * Tests that the review tracking endpoint is responsive and database is accessible
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabaseClient';

export async function GET() {
  try {
    // Test database connectivity first
    const supabase = createClient();
    
    // Simple query to test database connection
    const { error: dbError } = await supabase
      .from('accounts')
      .select('id')
      .limit(1);
    
    if (dbError) {
      return NextResponse.json(
        {
          status: 'unhealthy',
          component: 'database',
          error: 'Database connection failed',
          timestamp: new Date().toISOString()
        },
        { status: 503 }
      );
    }
    
    // Test that the review tracking endpoint structure is accessible
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/track-review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        healthCheck: true // Special flag to avoid actual tracking
      })
    });
    
    if (response.ok || response.status === 400 || response.status === 422) {
      // These status codes indicate the endpoint is working
      return NextResponse.json({
        status: 'healthy',
        endpoint: '/api/track-review',
        database: 'connected',
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json(
        {
          status: 'unhealthy',
          endpoint: '/api/track-review',
          error: `HTTP ${response.status}`,
          timestamp: new Date().toISOString()
        },
        { status: 503 }
      );
    }
    
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        endpoint: '/api/track-review',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    );
  }
} 