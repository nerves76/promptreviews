/**
 * Upgrade Account to Maven Plan Script
 * 
 * This script upgrades the specified account to the Maven plan.
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
);

async function upgradeToMaven() {
  console.log('🚀 Upgrading Account to Maven Plan');
  console.log('====================================');

  try {
    // Find the user by email
    console.log('📧 Looking for user: chris@diviner.agency');
    
    const { data: users, error: userError } = await supabase
      .from('auth.users')
      .select('id, email')
      .eq('email', 'chris@diviner.agency')
      .single();

    if (userError || !users) {
      console.log('❌ User not found, trying accounts table...');
      
      // Try to find in accounts table
      const { data: accounts, error: accountError } = await supabase
        .from('accounts')
        .select('id, email, plan')
        .eq('email', 'chris@diviner.agency')
        .single();

      if (accountError || !accounts) {
        console.log('❌ Account not found in accounts table');
        console.log('🔍 Available accounts:');
        
        const { data: allAccounts } = await supabase
          .from('accounts')
          .select('id, email, plan')
          .limit(10);
        
        allAccounts?.forEach(acc => {
          console.log(`  - ${acc.email} (${acc.plan})`);
        });
        
        return;
      }

      console.log(`✅ Found account: ${accounts.email} (current plan: ${accounts.plan})`);
      
      // Update the account to Maven plan
      const { data: updatedAccount, error: updateError } = await supabase
        .from('accounts')
        .update({ 
          plan: 'maven',
          updated_at: new Date().toISOString()
        })
        .eq('id', accounts.id)
        .select()
        .single();

      if (updateError) {
        console.log('❌ Error updating account:', updateError);
        return;
      }

      console.log(`✅ Successfully upgraded to Maven plan!`);
      console.log(`📊 New plan: ${updatedAccount.plan}`);
      console.log(`🆔 Account ID: ${updatedAccount.id}`);
      
    } else {
      console.log(`✅ Found user: ${users.email}`);
      
      // Find the account associated with this user
      const { data: accounts, error: accountError } = await supabase
        .from('accounts')
        .select('id, email, plan')
        .eq('id', users.id)
        .single();

      if (accountError || !accounts) {
        console.log('❌ No account found for this user');
        return;
      }

      console.log(`📊 Current plan: ${accounts.plan}`);
      
      // Update to Maven plan
      const { data: updatedAccount, error: updateError } = await supabase
        .from('accounts')
        .update({ 
          plan: 'maven',
          updated_at: new Date().toISOString()
        })
        .eq('id', accounts.id)
        .select()
        .single();

      if (updateError) {
        console.log('❌ Error updating account:', updateError);
        return;
      }

      console.log(`✅ Successfully upgraded to Maven plan!`);
      console.log(`📊 New plan: ${updatedAccount.plan}`);
      console.log(`🆔 Account ID: ${updatedAccount.id}`);
    }

    console.log('\n🎉 Upgrade complete! The account now has Maven plan access.');
    console.log('📋 Maven plan includes:');
    console.log('   - Unlimited prompt pages');
    console.log('   - Advanced analytics');
    console.log('   - Priority support');
    console.log('   - All premium features');

  } catch (error) {
    console.log('❌ Error:', error);
  }
}

// Run the upgrade
upgradeToMaven(); 