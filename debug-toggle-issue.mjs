#!/usr/bin/env node

/**
 * Debug Toggle Issue
 * 
 * This script checks the current state of emoji sentiment and friendly note
 * to see if there's a conflict preventing the toggle from working.
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function main() {
  console.log('🔍 Debug Toggle Issue')
  console.log('=====================')
  
  try {
    // Query the universal prompt page specifically
    const { data: universalPage, error } = await supabase
      .from('prompt_pages')
      .select('id, slug, show_friendly_note, friendly_note, emoji_sentiment_enabled')
      .eq('slug', 'universal-mdv0wlgj')
      .single()
    
    if (error) {
      console.error('❌ Error querying universal page:', error)
      return
    }
    
    if (!universalPage) {
      console.error('❌ Universal page not found')
      return
    }
    
    console.log('\n📊 Current Universal Page State:')
    console.log('==================================')
    console.log('Slug:', universalPage.slug)
    console.log('Friendly Note Enabled:', universalPage.show_friendly_note)
    console.log('Friendly Note Content:', `"${universalPage.friendly_note || 'EMPTY'}"`)
    console.log('Emoji Sentiment Enabled:', universalPage.emoji_sentiment_enabled)
    
    console.log('\n🔍 Conflict Analysis:')
    console.log('======================')
    
    if (universalPage.emoji_sentiment_enabled && universalPage.show_friendly_note) {
      console.log('🚨 CONFLICT DETECTED!')
      console.log('   Both emoji sentiment AND friendly note are enabled')
      console.log('   This should not be possible - they conflict with each other')
    } else if (universalPage.emoji_sentiment_enabled) {
      console.log('😀 Emoji sentiment is enabled (friendly note should be disabled)')
      console.log('   ✅ This is correct - only one popup feature should be active')
    } else if (universalPage.show_friendly_note) {
      console.log('📝 Friendly note is enabled (emoji sentiment should be disabled)')
      console.log('   ✅ This is correct - only one popup feature should be active')
    } else {
      console.log('💤 Both features are disabled')
      console.log('   ✅ This is valid - no popups will show')
    }
    
    console.log('\n🔧 Toggle Test:')
    console.log('===============')
    
    if (universalPage.emoji_sentiment_enabled) {
      console.log('⚠️  Cannot toggle friendly note ON because emoji sentiment is enabled')
      console.log('   You need to turn OFF emoji sentiment first')
    } else {
      console.log('✅ Friendly note should be toggleable')
      
      if (universalPage.show_friendly_note) {
        console.log('   Current action: Turn OFF friendly note')
      } else {
        console.log('   Current action: Turn ON friendly note')
      }
    }
    
  } catch (err) {
    console.error('❌ Script error:', err)
  }
}

main()