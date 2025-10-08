import { NextResponse } from 'next/server'
import { getArticleBySlug } from '@/lib/articles'

export const dynamic = 'force-dynamic'

export async function GET() {
  const checks: Record<string, { status: 'ok' | 'error'; message?: string }> = {
    app: { status: 'ok' },
  }

  try {
    await getArticleBySlug('getting-started')
    checks.supabase = { status: 'ok' }
  } catch (error: any) {
    checks.supabase = { status: 'error', message: error?.message || 'Failed to query Supabase' }
  }

  const healthy = Object.values(checks).every((check) => check.status === 'ok')

  return NextResponse.json(
    {
      status: healthy ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: healthy ? 200 : 503 }
  )
}
