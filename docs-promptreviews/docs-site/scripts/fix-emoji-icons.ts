/**
 * Fix emoji icons to Lucide icon names
 * Run with: npx ts-node scripts/fix-emoji-icons.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ltneloufqjktdplodvao.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0bmVsb3VmcWprdGRwbG9kdmFvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODA0MTU3OCwiZXhwIjoyMDYzNjE3NTc4fQ.IkGh1VhXoqUSGPudm3NH9BqrUP2GMb1OxfmzJxpwOL4'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Emoji to Lucide icon name mapping
const iconMap: Record<string, string> = {
  '🧠': 'Brain',
  '🎯': 'Target',
  '🪄': 'Wand2',
  '📈': 'TrendingUp',
  '🛡️': 'Shield',
  '🛡': 'Shield',
  '✏️': 'Edit3',
  '✏': 'Edit3',
  '⭐': 'Star',
  '💡': 'Lightbulb',
  '👥': 'Users',
  '💬': 'MessageSquare',
  '❤️': 'Heart',
  '❤': 'Heart',
  '⏰': 'Clock',
  '⚡': 'Zap',
  '📌': 'Wand2', // Pin/pushpin -> magic wand for review assistance
}

function fixIcons(items: any[]): any[] {
  if (!Array.isArray(items)) return items

  return items.map(item => {
    if (item.icon && iconMap[item.icon]) {
      return { ...item, icon: iconMap[item.icon] }
    }
    return item
  })
}

async function main() {
  console.log('Fetching ai-reviews article...')

  const { data: article, error: fetchError } = await supabase
    .from('articles')
    .select('id, slug, metadata')
    .eq('slug', 'ai-reviews')
    .single()

  if (fetchError || !article) {
    console.error('Error fetching article:', fetchError)
    process.exit(1)
  }

  console.log('Article found:', article.slug)
  console.log('Current metadata:', JSON.stringify(article.metadata, null, 2))

  const metadata = article.metadata || {}

  // Fix icons in key_features, how_it_works, and best_practices
  const updatedMetadata = {
    ...metadata,
    key_features: fixIcons(metadata.key_features),
    how_it_works: fixIcons(metadata.how_it_works),
    best_practices: fixIcons(metadata.best_practices),
  }

  console.log('\nUpdated metadata:', JSON.stringify(updatedMetadata, null, 2))

  // Update the article
  const { error: updateError } = await supabase
    .from('articles')
    .update({ metadata: updatedMetadata })
    .eq('id', article.id)

  if (updateError) {
    console.error('Error updating article:', updateError)
    process.exit(1)
  }

  console.log('\n✅ Successfully updated icons from emojis to Lucide icon names!')
}

main()
