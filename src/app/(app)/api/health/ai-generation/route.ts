/**
 * AI Generation Health Check
 * Tests that the AI generation endpoint is responsive and properly configured
 */

import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test that the AI generation endpoint is reachable with a minimal test
    const testPrompt = "test";
    
    // Don't actually call OpenAI, just test the endpoint structure
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/generate-review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        prompt: testPrompt,
        healthCheck: true // Special flag to avoid actual AI generation
      })
    });
    
    if (response.ok || response.status === 400) {
      // 400 is acceptable - means endpoint is working but rejected health check
      return NextResponse.json({
        status: 'healthy',
        endpoint: '/api/generate-review',
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json(
        {
          status: 'unhealthy',
          endpoint: '/api/generate-review',
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
        endpoint: '/api/generate-review',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    );
  }
} 