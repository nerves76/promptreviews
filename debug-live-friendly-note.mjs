#!/usr/bin/env node

/**
 * Debug Live Friendly Note Issue
 * 
 * This script checks the current state of friendly note settings on the live site
 * and can fix cases where show_friendly_note is true but should be false.
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables:')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function main() {
  console.log('🔍 Debugging Live Friendly Note Issue')
  console.log('=====================================')
  
  try {
    // Query all prompt pages with friendly note settings
    const { data: promptPages, error } = await supabase
      .from('prompt_pages')
      .select('id, slug, show_friendly_note, friendly_note')
      .order('updated_at', { ascending: false })
    
    if (error) {
      console.error('❌ Error querying prompt pages:', error)
      return
    }
    
    console.log(`📊 Found ${promptPages.length} prompt pages total`)
    
    // Check for issues
    const issuesFound = []
    const activeWithContent = []
    const activeWithoutContent = []
    const inactiveWithContent = []
    const inactiveWithoutContent = []
    
    promptPages.forEach(page => {
      const hasContent = page.friendly_note && page.friendly_note.trim().length > 0
      const isEnabled = page.show_friendly_note
      
      if (isEnabled && hasContent) {
        activeWithContent.push(page)
      } else if (isEnabled && !hasContent) {
        activeWithoutContent.push(page)
        issuesFound.push({
          ...page,
          issue: 'ENABLED_BUT_EMPTY',
          description: 'Friendly note is enabled but has no content'
        })
      } else if (!isEnabled && hasContent) {
        inactiveWithContent.push(page)
        // This might be the user's issue - they turned it off but it may still show
      } else {
        inactiveWithoutContent.push(page)
      }
    })
    
    console.log('\n📈 Summary:')
    console.log(`✅ Active with content: ${activeWithContent.length}`)
    console.log(`⚠️  Active but empty: ${activeWithoutContent.length}`)
    console.log(`📝 Inactive with content: ${inactiveWithContent.length}`)
    console.log(`💤 Inactive and empty: ${inactiveWithoutContent.length}`)
    
    if (activeWithContent.length > 0) {
      console.log('\n✅ Active Friendly Notes (these should show on live site):')
      activeWithContent.forEach(page => {
        console.log(`   • Slug: ${page.slug}`)
        console.log(`     Content: "${page.friendly_note?.substring(0, 50)}${page.friendly_note?.length > 50 ? '...' : ''}"`)
      })
    }
    
    if (inactiveWithContent.length > 0) {
      console.log('\n📝 Inactive but with Content (these should NOT show):')
      inactiveWithContent.forEach(page => {
        console.log(`   • Slug: ${page.slug}`)
        console.log(`     show_friendly_note: ${page.show_friendly_note}`)
        console.log(`     Content: "${page.friendly_note?.substring(0, 50)}${page.friendly_note?.length > 50 ? '...' : ''}"`)
      })
    }
    
    if (issuesFound.length > 0) {
      console.log('\n🚨 Issues Found:')
      issuesFound.forEach((issue, index) => {
        console.log(`   ${index + 1}. Slug: ${issue.slug}`)
        console.log(`      Issue: ${issue.description}`)
        console.log(`      show_friendly_note: ${issue.show_friendly_note}`)
        console.log(`      friendly_note: "${issue.friendly_note || 'EMPTY'}"`)
      })
      
      // Offer to fix the issues
      console.log('\n🔧 Fix available: Set show_friendly_note = false for pages with empty content')
      console.log('   Run this script with --fix flag to apply the fix')
    }
    
    // Check if user wants to fix
    const shouldFix = process.argv.includes('--fix')
    
    if (shouldFix && issuesFound.length > 0) {
      console.log('\n🔧 Applying fixes...')
      
      for (const issue of issuesFound) {
        if (issue.issue === 'ENABLED_BUT_EMPTY') {
          const { error: updateError } = await supabase
            .from('prompt_pages')
            .update({ show_friendly_note: false })
            .eq('id', issue.id)
          
          if (updateError) {
            console.error(`❌ Failed to fix ${issue.slug}:`, updateError)
          } else {
            console.log(`✅ Fixed ${issue.slug}: set show_friendly_note = false`)
          }
        }
      }
      
      console.log('\n🎉 Fix complete!')
    }
    
  } catch (err) {
    console.error('❌ Script error:', err)
  }
}

main()