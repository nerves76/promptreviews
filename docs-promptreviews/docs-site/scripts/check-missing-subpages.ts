#!/usr/bin/env ts-node
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://ltneloufqjktdplodvao.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0bmVsb3VmcWprdGRwbG9kdmFvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODA0MTU3OCwiZXhwIjoyMDYzNjE3NTc4fQ.IkGh1VhXoqUSGPudm3NH9BqrUP2GMb1OxfmzJxpwOL4'
)

const expectedSlugs = [
  'google-business/bulk-updates',
  'google-business/business-info',
  'google-business/categories-services',
  'google-business/image-upload',
  'google-business/review-import',
  'google-business/scheduling'
]

async function main() {
  console.log('🔍 Checking for missing Google Business subpages...\n')

  const missing = []
  const found = []

  for (const slug of expectedSlugs) {
    const { data, error } = await supabase
      .from('articles')
      .select('slug, title, status')
      .eq('slug', slug)
      .maybeSingle()

    if (data) {
      found.push({ slug, title: data.title, status: data.status })
      console.log(`✅ ${slug}`)
      console.log(`   Title: ${data.title}`)
      console.log(`   Status: ${data.status}`)
    } else {
      missing.push(slug)
      console.log(`❌ ${slug} - NOT IN DATABASE`)
    }
    console.log()
  }

  console.log('\n📊 Summary:')
  console.log(`   Found: ${found.length}`)
  console.log(`   Missing: ${missing.length}`)

  if (missing.length > 0) {
    console.log('\n❌ Missing articles need to be created in CMS:')
    missing.forEach(slug => console.log(`   - ${slug}`))
  }
}

main()
