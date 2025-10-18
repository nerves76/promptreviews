import { NextResponse } from 'next/server';
import { getNavigationTree } from '@/lib/docs/articles';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const navigation = await getNavigationTree();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      navigation,
      environment: {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
