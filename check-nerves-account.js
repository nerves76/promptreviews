require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkNervesAccount() {
  console.log('🔍 Checking for nerves76@gmail.com account...\n');
  
  try {
    // Check auth users first
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
    
    console.log('👤 Checking auth.users table:');
    const nervesUser = users?.find(u => u.email === 'nerves76@gmail.com');
    
    if (nervesUser) {
      console.log('✅ Found auth user:');
      console.log('  Email:', nervesUser.email);
      console.log('  ID:', nervesUser.id);
      console.log('  Confirmed:', !!nervesUser.email_confirmed_at);
      console.log('  Created:', nervesUser.created_at);
      
      // Now check if there's an account record
      const { data: accounts, error: accountsError } = await supabase
        .from('accounts')
        .select('*')
        .eq('id', nervesUser.id);  // Using user ID to find account
      
      console.log('\n🏢 Checking accounts table:');
      if (accounts && accounts.length > 0) {
        accounts.forEach((account, index) => {
          console.log(`  Account ${index + 1}:`);
          console.log('    Email:', account.email);
          console.log('    Plan:', account.plan);
          console.log('    Is Admin:', account.is_admin);
          console.log('    Trial End:', account.trial_end);
          console.log('    Account ID:', account.id);
        });
        
        // Check businesses for this account
        const { data: businesses } = await supabase
          .from('businesses')
          .select('*')
          .eq('account_id', accounts[0].id);
        
        console.log('\n🏢 Businesses:');
        if (businesses && businesses.length > 0) {
          businesses.forEach((business, index) => {
            console.log(`  ${index + 1}. ${business.name} (Created: ${business.created_at})`);
          });
        } else {
          console.log('  No businesses found');
        }
        
        // Analyze the issue
        const account = accounts[0];
        console.log('\n🔍 Analysis:');
        if (account.plan && account.plan !== 'no_plan' && account.plan !== 'NULL') {
          console.log('  ❌ FOUND THE ISSUE!');
          console.log('  This account already has a plan:', account.plan);
          console.log('  When you "signed up", you actually just logged into this existing account.');
          console.log('  Since it already has a plan, no plan selection modal was shown.');
          
          console.log('\n💡 Solutions:');
          console.log('  1. Reset this account\'s plan to "no_plan"');
          console.log('  2. Delete existing businesses (optional)'); 
          console.log('  3. Create a new business to trigger plan selection');
          
        } else {
          console.log('  ✅ Plan is', account.plan, '- should trigger plan selection');
        }
        
      } else {
        console.log('  ❌ No account record found for this user');
        console.log('  This is unusual - auth user exists but no account record');
      }
      
    } else {
      console.log('❌ No auth user found with email nerves76@gmail.com');
      
      // Also check accounts table by email
      const { data: accountsByEmail } = await supabase
        .from('accounts')
        .select('*')
        .eq('email', 'nerves76@gmail.com');
      
      if (accountsByEmail && accountsByEmail.length > 0) {
        console.log('\n⚠️  Found account records by email but no auth user:');
        accountsByEmail.forEach((account, index) => {
          console.log(`  ${index + 1}. Plan: ${account.plan}, ID: ${account.id}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

async function fixNervesAccount() {
  console.log('🔧 Fixing nerves76@gmail.com account...\n');
  
  try {
    // Find the user first
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const nervesUser = users?.find(u => u.email === 'nerves76@gmail.com');
    
    if (!nervesUser) {
      console.log('❌ No nerves76@gmail.com user found to fix');
      return;
    }
    
    console.log('📝 Resetting plan for nerves76@gmail.com...');
    const { data, error } = await supabase
      .from('accounts')
      .update({ 
        plan: 'no_plan',
        is_admin: true  // Also give admin privileges
      })
      .eq('id', nervesUser.id)
      .select();

    if (error) {
      console.error('❌ Error updating account:', error.message);
      return;
    }

    console.log('✅ Account fixed! Plan reset to "no_plan" and admin privileges granted.');
    console.log('\n🎯 Now when you create a business, you should see plan selection!');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Check command line arguments
const command = process.argv[2];

if (command === 'fix') {
  fixNervesAccount();
} else {
  checkNervesAccount();
  console.log('\n💡 To fix the account, run:');
  console.log('   node check-nerves-account.js fix');
} 