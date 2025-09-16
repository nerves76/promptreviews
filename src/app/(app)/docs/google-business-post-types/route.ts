import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const docPath = path.join(process.cwd(), 'docs', 'google-business-post-types.md');
    const content = fs.readFileSync(docPath, 'utf-8');
    
    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Error reading documentation file:', error);
    return NextResponse.json(
      { error: 'Documentation not found' },
      { status: 404 }
    );
  }
}