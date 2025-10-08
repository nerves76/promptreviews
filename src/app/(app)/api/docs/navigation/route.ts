import { NextResponse } from 'next/server';
import { getNavigationTree } from '@/lib/docs/navigation';

export const revalidate = 300;

export async function GET() {
  try {
    const navigation = await getNavigationTree();

    return NextResponse.json({
      navigation,
      total: navigation.length,
    });
  } catch (error) {
    console.error('Error fetching docs navigation:', error);
    return NextResponse.json({ error: 'Failed to load navigation' }, { status: 500 });
  }
}

