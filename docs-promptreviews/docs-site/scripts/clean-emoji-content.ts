#!/usr/bin/env ts-node
/**
 * Remove emoji-based features/sections from content field
 * These should only be in structured metadata, not markdown content
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://ltneloufqjktdplodvao.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0bmVsb3VmcWprdGRwbG9kdmFvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODA0MTU3OCwiZXhwIjoyMDYzNjE3NTc4fQ.IkGh1VhXoqUSGPudm3NH9BqrUP2GMb1OxfmzJxpwOL4'
)

function cleanContent(content: string, metadata: any): string {
  // If no structured metadata, don't touch content
  if (!metadata?.key_features?.length && !metadata?.how_it_works?.length && !metadata?.best_practices?.length) {
    return content
  }

  // Remove sections that are in structured metadata
  let cleaned = content

  // Remove "## Key Features" section if key_features exists in metadata
  if (metadata?.key_features?.length) {
    // Remove from "## Key Features" to the next ## heading or end
    cleaned = cleaned.replace(/##\s*Key Features[\s\S]*?(?=##|$)/gi, '')
  }

  // Remove "## How It Works" / "## How it Works" section if how_it_works exists
  if (metadata?.how_it_works?.length) {
    cleaned = cleaned.replace(/##\s*How [Ii]t Works[\s\S]*?(?=##|$)/gi, '')
  }

  // Remove "## Best Practices" section if best_practices exists
  if (metadata?.best_practices?.length) {
    cleaned = cleaned.replace(/##\s*Best Practices[\s\S]*?(?=##|$)/gi, '')
  }

  // Remove any standalone emoji headings that might be left
  // Pattern: ### [emoji] Title (common emojis used in docs)
  const emojiPattern = /###\s*[📌🎯🛡️🛡📈⭐💡👥💬❤️⏰⚡✏️✏🧠🪄].*$/gm
  cleaned = cleaned.replace(emojiPattern, '')

  // Clean up excessive newlines
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n')
  cleaned = cleaned.trim()

  return cleaned
}

async function main() {
  console.log('🔍 Fetching all published articles...\n')

  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, slug, content, metadata')
    .eq('status', 'published')

  if (error) {
    console.error('Error fetching articles:', error)
    process.exit(1)
  }

  console.log(`Found ${articles.length} published articles\n`)

  const updates: any[] = []

  for (const article of articles) {
    const originalContent = article.content || ''
    const cleanedContent = cleanContent(originalContent, article.metadata)

    if (originalContent !== cleanedContent) {
      const removed = originalContent.length - cleanedContent.length
      console.log(`📝 ${article.slug}`)
      console.log(`   Original: ${originalContent.length} chars`)
      console.log(`   Cleaned:  ${cleanedContent.length} chars`)
      console.log(`   Removed:  ${removed} chars`)
      console.log()

      updates.push({
        id: article.id,
        slug: article.slug,
        content: cleanedContent
      })
    }
  }

  if (updates.length === 0) {
    console.log('✅ No articles need cleaning!')
    return
  }

  console.log(`\n📊 Summary: ${updates.length} articles to update`)
  console.log('\nUpdating database...\n')

  for (const update of updates) {
    const { error } = await supabase
      .from('articles')
      .update({ content: update.content })
      .eq('id', update.id)

    if (error) {
      console.error(`❌ Error updating ${update.slug}:`, error)
    } else {
      console.log(`✅ Updated: ${update.slug}`)
    }
  }

  console.log(`\n✅ Complete! Cleaned ${updates.length} articles`)
}

main()
