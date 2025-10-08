import { NextResponse } from 'next/server';
import { runHealthCheck } from '@/lib/health/check';

export const dynamic = 'force-dynamic';

export async function GET() {
  const result = await runHealthCheck();

  return NextResponse.json(
    {
      status: result.healthy ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      checks: result.checks,
    },
    { status: result.healthy ? 200 : 503 },
  );
}
