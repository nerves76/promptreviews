#!/usr/bin/env ts-node
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://ltneloufqjktdplodvao.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0bmVsb3VmcWprdGRwbG9kdmFvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODA0MTU3OCwiZXhwIjoyMDYzNjE3NTc4fQ.IkGh1VhXoqUSGPudm3NH9BqrUP2GMb1OxfmzJxpwOL4'
)

async function main() {
  const { data, error } = await supabase
    .from('articles')
    .select('content, metadata, updated_at')
    .eq('slug', 'ai-reviews')
    .single()

  if (error) {
    console.error('Error:', error)
    process.exit(1)
  }

  console.log('=== LAST UPDATED ===')
  console.log(data.updated_at)

  console.log('\n=== CONTENT (first 500 chars) ===')
  console.log(data.content.substring(0, 500))
  console.log('...')

  console.log('\n=== KEY FEATURES TITLE ===')
  console.log(data.metadata?.key_features_title || '(not set - will use default)')

  console.log('\n=== DESCRIPTION ===')
  console.log(data.metadata?.description || '(not set)')

  console.log('\n=== OVERVIEW TITLE ===')
  console.log(data.metadata?.overview_title || '(not set - will use default)')
}

main()
