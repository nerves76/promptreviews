/**
 * Upgrade Local User to Maven Plan
 * 
 * This script upgrades nerves76@gmail.com to Maven plan in local database
 * Safely upgrades plan limits and settings for development testing
 */

const { createClient } = require('@supabase/supabase-js');

// Local Supabase configuration
const supabaseUrl = 'http://127.0.0.1:54321';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function upgradeToMaven() {
  console.log('🚀 Starting Maven upgrade for nerves76@gmail.com...');
  
  try {
    // Get current account
    const { data: currentAccount, error: fetchError } = await supabase
      .from('accounts')
      .select('*')
      .eq('email', 'nerves76@gmail.com')
      .single();
    
    if (fetchError) {
      console.error('❌ Error fetching account:', fetchError);
      return;
    }
    
    if (!currentAccount) {
      console.error('❌ Account not found for nerves76@gmail.com');
      return;
    }
    
    console.log('📋 Current account status:', {
      id: currentAccount.id,
      email: currentAccount.email,
      plan: currentAccount.plan,
      max_users: currentAccount.max_users,
      max_locations: currentAccount.max_locations,
      max_contacts: currentAccount.max_contacts,
      max_prompt_pages: currentAccount.max_prompt_pages
    });
    
    // Maven plan limits (based on your pricing structure)
    const mavenLimits = {
      plan: 'maven',
      subscription_status: 'active',
      max_users: 10,        // Maven allows multiple team members
      max_locations: 10,    // Multiple business locations
      max_contacts: 10000,  // Large contact database
      max_prompt_pages: 100, // Many prompt pages
      has_had_paid_plan: true,
      plan_lookup_key: 'maven'
    };
    
    console.log('⬆️ Upgrading to Maven with limits:', mavenLimits);
    
    // Update account to Maven
    const { data: updatedAccount, error: updateError } = await supabase
      .from('accounts')
      .update(mavenLimits)
      .eq('id', currentAccount.id)
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ Error updating account:', updateError);
      return;
    }
    
    console.log('✅ Successfully upgraded to Maven!');
    console.log('📋 New account status:', {
      id: updatedAccount.id,
      email: updatedAccount.email,
      plan: updatedAccount.plan,
      subscription_status: updatedAccount.subscription_status,
      max_users: updatedAccount.max_users,
      max_locations: updatedAccount.max_locations,
      max_contacts: updatedAccount.max_contacts,
      max_prompt_pages: updatedAccount.max_prompt_pages,
      has_had_paid_plan: updatedAccount.has_had_paid_plan
    });
    
    console.log('🎉 Maven upgrade completed successfully!');
    console.log('💡 You now have access to:');
    console.log('   - Up to 10 team members');
    console.log('   - Up to 10 business locations');
    console.log('   - Up to 10,000 contacts');
    console.log('   - Up to 100 prompt pages');
    console.log('   - All premium features');
    
  } catch (error) {
    console.error('💥 Unexpected error during upgrade:', error);
  }
}

// Run the upgrade
upgradeToMaven().then(() => {
  console.log('✨ Upgrade script completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});