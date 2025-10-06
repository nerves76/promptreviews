import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'

/**
 * On-demand revalidation endpoint for CMS updates
 *
 * Usage:
 * POST /api/revalidate
 * Body: {
 *   secret: "your_secret_token",
 *   path: "/ai-reviews" (optional - specific path)
 *   slug: "ai-reviews" (optional - specific article)
 *   all: true (optional - revalidate all pages)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { secret, path, slug, all } = body

    // Verify secret token
    const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET || 'dev_secret_change_in_production'
    if (secret !== REVALIDATE_SECRET) {
      return NextResponse.json(
        { error: 'Invalid secret' },
        { status: 401 }
      )
    }

    // Revalidate based on parameters
    if (all) {
      // Revalidate all common paths
      const paths = [
        '/',
        '/ai-reviews',
        '/google-business',
        '/prompt-pages',
        '/getting-started',
        '/strategies',
      ]

      for (const p of paths) {
        revalidatePath(p)
      }

      console.log('✅ Revalidated all common paths')
      return NextResponse.json({
        revalidated: true,
        paths,
        message: 'Revalidated all common paths'
      })
    }

    if (path) {
      revalidatePath(path)
      console.log(`✅ Revalidated path: ${path}`)
      return NextResponse.json({
        revalidated: true,
        path,
        message: `Revalidated path: ${path}`
      })
    }

    if (slug) {
      // Revalidate by tag
      revalidateTag(`article:${slug}`)
      console.log(`✅ Revalidated article: ${slug}`)
      return NextResponse.json({
        revalidated: true,
        slug,
        message: `Revalidated article: ${slug}`
      })
    }

    return NextResponse.json(
      { error: 'Missing revalidation parameters (path, slug, or all)' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Revalidation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Allow GET for simple health check
export async function GET() {
  return NextResponse.json({
    status: 'ready',
    message: 'Revalidation API endpoint'
  })
}
