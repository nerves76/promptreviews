import { NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin/permissions';

export async function POST() {
  try {
    await requireAdminAccess();

    const hookUrl = process.env.VERCEL_DOCS_DEPLOY_HOOK_URL;
    if (!hookUrl) {
      return NextResponse.json(
        { error: 'Deploy hook not configured' },
        { status: 500 }
      );
    }

    const response = await fetch(hookUrl, {
      method: 'POST',
      cache: 'no-store'
    });

    const text = await response.text();
    let payload: unknown = null;

    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = text;
      }
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          error: 'Failed to trigger deploy',
          details: payload ?? null
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      deployment: payload ?? null
    });
  } catch (error) {
    console.error('Error triggering docs deploy:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
