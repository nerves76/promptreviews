/**
 * Test Personalized Note Script
 * 
 * This script adds a personalized note to the existing prompt page
 * to test the popup functionality.
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
);

async function testPersonalizedNote() {
  console.log('📝 Testing Personalized Note on Existing Prompt Page');
  console.log('==================================================');

  try {
    // Find the user and account
    const { data: users } = await supabase.auth.admin.listUsers();
    const user = users.users.find(u => u.email === 'chris@diviner.agency');
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    const { data: accountUsers } = await supabase
      .from('account_users')
      .select('account_id')
      .eq('user_id', user.id);
    
    if (!accountUsers || accountUsers.length === 0) {
      console.log('❌ No account found for user');
      return;
    }

    const accountId = accountUsers[0].account_id;
    
    // Update the existing prompt page with a personalized note
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
      .eq('account_id', accountId)
      .eq('slug', 'universal-mdouijec')
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
    console.log(`   URL: http://localhost:3002/r/universal-mdouijec`);
    
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

testPersonalizedNote(); 