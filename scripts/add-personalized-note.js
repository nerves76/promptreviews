/**
 * Add Personalized Note Script
 * 
 * This script adds a personalized note to the test prompt page
 * to verify the popup feature is working correctly.
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
);

async function addPersonalizedNote() {
  console.log('📝 Adding Personalized Note to Test Prompt Page');
  console.log('==============================================');

  try {
    // Update the test prompt page with a personalized note
    const testSlug = 'chris-bolton-a-prompt-1753744554216-a4x9vy';
    
    const personalizedNote = `Hi there! 👋

Thanks for visiting our review page. We really appreciate you taking the time to share your experience with us.

Your feedback helps us improve and also helps other customers find us. Whether you had a great experience or have suggestions for improvement, we'd love to hear from you!

Feel free to use our AI-powered review templates or write your own - whatever feels most authentic to you.

Thanks again! 🙏`;

    const { data: updatedPage, error } = await supabase
      .from('prompt_pages')
      .update({
        friendly_note: personalizedNote,
        show_friendly_note: true
      })
      .eq('slug', testSlug)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating prompt page:', error);
      return;
    }

    console.log('✅ Successfully updated prompt page:');
    console.log(`   - Slug: ${updatedPage.slug}`);
    console.log(`   - Show friendly note: ${updatedPage.show_friendly_note}`);
    console.log(`   - Friendly note: "${updatedPage.friendly_note}"`);
    
    console.log('\n🎉 Now visit your prompt page to see the personalized note popup!');
    console.log(`   URL: http://localhost:3002/r/${testSlug}`);
    
    console.log('\n📋 What should happen:');
    console.log('   1. Visit the prompt page');
    console.log('   2. A popup should appear with the personalized note');
    console.log('   3. Click the red X to close the popup');
    console.log('   4. The popup should not appear again during the session');

  } catch (error) {
    console.error('❌ Script failed:', error);
  }
}

// Run the script
addPersonalizedNote(); 