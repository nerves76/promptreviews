#!/usr/bin/env ts-node
/**
 * Trigger on-demand revalidation for docs site after CMS updates
 *
 * Usage:
 *   npm run revalidate              - Revalidate all common pages
 *   npm run revalidate ai-reviews   - Revalidate specific page
 */

async function revalidate(path?: string) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://docs.promptreviews.app'
  const secret = process.env.REVALIDATE_SECRET || 'dev_secret_change_in_production'

  const body = path
    ? { secret, path: `/${path}` }
    : { secret, all: true }

  console.log(`🔄 Triggering revalidation for: ${path || 'all pages'}...`)

  try {
    const response = await fetch(`${siteUrl}/api/revalidate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const result = await response.json()

    if (response.ok) {
      console.log('✅', result.message)
      console.log('\nRevalidated:', result.paths || result.path || result.slug)
    } else {
      console.error('❌ Revalidation failed:', result.error)
      process.exit(1)
    }
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

const path = process.argv[2]
revalidate(path)
