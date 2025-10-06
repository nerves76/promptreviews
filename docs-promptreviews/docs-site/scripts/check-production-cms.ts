#!/usr/bin/env ts-node
/**
 * Check what articles exist in production CMS
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ltneloufqjktdplodvao.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0bmVsb3VmcWprdGRwbG9kdmFvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODA0MTU3OCwiZXhwIjoyMDYzNjE3NTc4fQ.IkGh1VhXoqUSGPudm3NH9BqrUP2GMb1OxfmzJxpwOL4'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function main() {
  console.log('🔍 Checking production database...\n')

  // Check if articles table exists and get count
  const { data: articles, error } = await supabase
    .from('articles')
    .select('slug, title, status, content, metadata')
    .eq('slug', 'ai-reviews')
    .single()

  if (error) {
    console.error('❌ Error fetching ai-reviews:', error.message)
    console.error('Full error:', error)

    // Try to get all articles to see what exists
    console.log('\n📋 Checking all articles...')
    const { data: allArticles, error: allError } = await supabase
      .from('articles')
      .select('slug, title, status')
      .limit(10)

    if (allError) {
      console.error('❌ Error fetching articles:', allError)
    } else {
      console.log(`Found ${allArticles?.length || 0} articles:`)
      allArticles?.forEach(a => {
        console.log(`  - ${a.slug} (${a.title}) [${a.status}]`)
      })
    }
    return
  }

  console.log('✅ Found ai-reviews article in production!')
  console.log('\nSlug:', articles.slug)
  console.log('Title:', articles.title)
  console.log('Status:', articles.status)
  console.log('Content length:', articles.content?.length || 0, 'characters')
  console.log('\nMetadata:', JSON.stringify(articles.metadata, null, 2))
}

main()
