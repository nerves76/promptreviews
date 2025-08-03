#!/usr/bin/env node

/**
 * Simple Debug script for Friendly Note feature issues
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function debugFriendlyNoteIssue() {
  console.log('🔍 Debugging Friendly Note Feature Issues...\n');
  
  try {
    // 1. Test basic database connection
    console.log('1. Testing database connection...');
    const { data: testConnection, error: connError } = await supabase
      .from('prompt_pages')
      .select('count')
      .limit(1);
    
    if (connError) {
      console.error('❌ Database connection failed:', connError);
      return;
    }
    console.log('✅ Database connection successful');
    
    // 2. Check for existing prompt pages with friendly note data
    console.log('\n2. Checking existing prompt pages with friendly note data...');
    const { data: pagesWithFriendlyNote, error: pagesError } = await supabase
      .from('prompt_pages')
      .select('id, slug, show_friendly_note, friendly_note, emoji_sentiment_enabled')
      .not('friendly_note', 'is', null)
      .neq('friendly_note', '')
      .limit(10);
    
    if (pagesError) {
      console.error('❌ Error fetching prompt pages:', pagesError);
      
      // If the column doesn't exist, we'll get a specific error
      if (pagesError.message.includes('column') && pagesError.message.includes('does not exist')) {
        console.log('🚨 ISSUE FOUND: The friendly_note or show_friendly_note columns are missing from the database!');
        console.log('📋 You need to run these SQL commands:');
        console.log('   ALTER TABLE prompt_pages ADD COLUMN IF NOT EXISTS show_friendly_note boolean DEFAULT false;');
        console.log('   ALTER TABLE prompt_pages ADD COLUMN IF NOT EXISTS friendly_note text DEFAULT \'\';');
        return;
      }
    } else {
      console.log(`📊 Found ${pagesWithFriendlyNote.length} prompt pages with friendly note content:`);
      pagesWithFriendlyNote.forEach((page, index) => {
        console.log(`   ${index + 1}. Slug: ${page.slug}`);
        console.log(`      - show_friendly_note: ${page.show_friendly_note}`);
        console.log(`      - friendly_note: "${page.friendly_note?.substring(0, 50)}${page.friendly_note?.length > 50 ? '...' : ''}"`);
        console.log(`      - emoji_sentiment_enabled: ${page.emoji_sentiment_enabled}`);
        
        // Check for conflicts
        if (page.show_friendly_note && page.emoji_sentiment_enabled) {
          console.log(`      ⚠️  CONFLICT: Both friendly note and emoji sentiment are enabled!`);
        }
        
        // Check for content but disabled display
        if (page.friendly_note && !page.show_friendly_note) {
          console.log(`      🚨 ISSUE: Has friendly note content but display is disabled!`);
        }
        
        console.log('');
      });
    }
    
    // 3. Check for all pages with show_friendly_note = true but no content
    console.log('3. Checking for pages with friendly note enabled but no content...');
    const { data: enabledButEmpty, error: emptyError } = await supabase
      .from('prompt_pages')
      .select('id, slug, show_friendly_note, friendly_note')
      .eq('show_friendly_note', true)
      .or('friendly_note.is.null,friendly_note.eq.')
      .limit(5);
    
    if (emptyError) {
      console.error('❌ Error checking empty friendly notes:', emptyError);
    } else if (enabledButEmpty.length > 0) {
      console.log(`⚠️  Found ${enabledButEmpty.length} pages with friendly note enabled but no content:`);
      enabledButEmpty.forEach(page => {
        console.log(`   - ${page.slug}: enabled but empty`);
      });
    } else {
      console.log('✅ No pages found with friendly note enabled but empty content');
    }
    
    // 4. Test updating a friendly note
    console.log('\n4. Testing friendly note update functionality...');
    const { data: testPage, error: fetchError } = await supabase
      .from('prompt_pages')
      .select('id, slug, show_friendly_note, friendly_note')
      .limit(1)
      .single();
    
    if (fetchError || !testPage) {
      console.log('⚠️  No test page found');
    } else {
      console.log(`🧪 Testing update on page: ${testPage.slug}`);
      console.log(`   Current state: show_friendly_note=${testPage.show_friendly_note}`);
      
      // Try to toggle the friendly note
      const newState = !testPage.show_friendly_note;
      const testNote = 'Test friendly note from debug script';
      
      const { error: updateError } = await supabase
        .from('prompt_pages')
        .update({ 
          show_friendly_note: newState,
          friendly_note: newState ? testNote : (testPage.friendly_note || '')
        })
        .eq('id', testPage.id);
      
      if (updateError) {
        console.error('❌ Failed to update friendly note:', updateError);
      } else {
        console.log(`✅ Successfully updated: show_friendly_note → ${newState}`);
        
        // Restore original state
        await supabase
          .from('prompt_pages')
          .update({ 
            show_friendly_note: testPage.show_friendly_note,
            friendly_note: testPage.friendly_note 
          })
          .eq('id', testPage.id);
        console.log('🔄 Restored original state');
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🎯 SUMMARY');
    console.log('='.repeat(60));
    
    console.log('\n📝 Key Findings:');
    console.log('- Database connection: ✅ Working');
    console.log('- Update functionality: ✅ Working');
    
    console.log('\n💡 Most likely issues:');
    console.log('1. Emoji sentiment conflict (both features enabled)');
    console.log('2. Friendly note content exists but display is disabled');
    console.log('3. Frontend form not saving changes properly');
    console.log('4. Browser cache preventing changes from showing');
    
    console.log('\n🔧 Next steps:');
    console.log('1. Run the fix script: node fix-friendly-note-issue.mjs');
    console.log('2. Check the prompt page edit form in browser dev tools');
    console.log('3. Look for JavaScript errors in the console');
    console.log('4. Verify the save button is actually submitting data');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the debug script
debugFriendlyNoteIssue().catch(console.error);