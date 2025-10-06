#!/usr/bin/env ts-node
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://ltneloufqjktdplodvao.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0bmVsb3VmcWprdGRwbG9kdmFvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODA0MTU3OCwiZXhwIjoyMDYzNjE3NTc4fQ.IkGh1VhXoqUSGPudm3NH9BqrUP2GMb1OxfmzJxpwOL4'
)

async function main() {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', 'ai-reviews')
    .single()

  if (error) {
    console.error('Error:', error)
    process.exit(1)
  }

  console.log('=== LAST UPDATED ===')
  console.log(data.updated_at)

  console.log('\n=== TITLE ===')
  console.log(data.title)

  console.log('\n=== FULL CONTENT ===')
  console.log(data.content)

  console.log('\n=== ALL METADATA ===')
  console.log(JSON.stringify(data.metadata, null, 2))
}

main()
