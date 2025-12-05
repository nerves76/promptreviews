const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAuthSetup() {
  console.log('🔍 Checking Authentication Setup...\n');

  try {
    // Get a test user - use auth.admin API
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 5
    });
    
    const users = authData?.users;
    const usersError = authError;

    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return;
    }

    console.log(`📊 Found ${users?.length || 0} recent users\n`);

    // Check each user for account
    for (const user of users || []) {
      console.log(`👤 User: ${user.email} (${user.id})`);
      console.log(`   Created: ${user.created_at}`);
      console.log(`   Confirmed: ${user.confirmed_at || 'NOT CONFIRMED'}`);

      // Check for account
      const { data: account, error: accountError } = await supabase
        .from('accounts')
        .select('id, email, plan, created_at')
        .eq('id', user.id)
        .single();

      if (accountError && accountError.code !== 'PGRST116') {
        console.log(`   ❌ Error checking account: ${accountError.message}`);
      } else if (!account) {
        console.log(`   ⚠️  NO ACCOUNT FOUND - This user will be redirected to create-business!`);
      } else {
        console.log(`   ✅ Has account: ${account.email}, Plan: ${account.plan}`);

        // Check for business
        const { data: business, error: businessError } = await supabase
          .from('businesses')
          .select('id, name, created_at')
          .eq('account_id', user.id)
          .single();

        if (businessError && businessError.code !== 'PGRST116') {
          console.log(`   ❌ Error checking business: ${businessError.message}`);
        } else if (!business) {
          console.log(`   ⚠️  NO BUSINESS FOUND - Will redirect to create-business`);
        } else {
          console.log(`   ✅ Has business: ${business.name}`);
        }
      }

      console.log('');
    }

    // Check if trigger exists
    console.log('🔧 Checking Auth Triggers:\n');
    
    const { data: triggers, error: triggerError } = await supabase
      .rpc('get_triggers_info');

    if (triggerError) {
      console.log('Could not check triggers (function may not exist)');
      
      // Try alternative query
      const { data: altTriggers, error: altError } = await supabase
        .from('information_schema.triggers')
        .select('trigger_name, event_manipulation, event_object_table')
        .eq('trigger_schema', 'auth')
        .eq('event_object_table', 'users');

      if (!altError && altTriggers) {
        console.log('Auth triggers found:');
        altTriggers.forEach(t => {
          console.log(`   - ${t.trigger_name} (${t.event_manipulation})`);
        });
      }
    } else if (triggers) {
      console.log('Triggers:', triggers);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkAuthSetup();