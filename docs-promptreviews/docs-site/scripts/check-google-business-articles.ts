#!/usr/bin/env ts-node
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://ltneloufqjktdplodvao.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0bmVsb3VmcWprdGRwbG9kdmFvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODA0MTU3OCwiZXhwIjoyMDYzNjE3NTc4fQ.IkGh1VhXoqUSGPudm3NH9BqrUP2GMb1OxfmzJxpwOL4'
)

async function main() {
  const { data, error } = await supabase
    .from('articles')
    .select('slug, title, status')
    .like('slug', 'google-business%')
    .order('slug')

  if (error) {
    console.error('Error:', error)
    process.exit(1)
  }

  console.log('📋 Google Business articles in database:\n')
  data.forEach(a => {
    console.log(`  [${a.status.padEnd(10)}] ${a.slug}`)
    console.log(`                   Title: ${a.title}`)
  })
  console.log(`\n✅ Total: ${data.length} articles`)
}

main()
