const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkUserAccountIssue() {
  const userId = '12a68cba-4d23-421e-be37-c4f21d3ab64a';
  console.log('🔍 Checking user account issue for:', userId);

  try {
    // Check auth.users
    const { data: userData } = await supabase.auth.admin.getUserById(userId);
    
    if (!userData || !userData.user) {
      console.log('❌ User not found in auth.users');
      return;
    }

    const user = userData.user;
    console.log('\n👤 Auth User found:');
    console.log('   Email:', user.email);
    console.log('   Created:', user.created_at);
    console.log('   Confirmed:', user.confirmed_at);

    // Check accounts table
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', userId)
      .single();

    if (accountError && accountError.code === 'PGRST116') {
      console.log('\n⚠️  NO ACCOUNT RECORD - User exists but has no account!');
      console.log('   This means the auth trigger failed to create an account');
      
      // Try to create the account manually
      console.log('\n🔧 Attempting to create account record...');
      
      const { data: newAccount, error: createError } = await supabase
        .from('accounts')
        .insert({
          id: userId,
          email: user.email || '',
          plan: 'no_plan',
          trial_start: new Date().toISOString(),
          trial_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_id: userId,
          first_name: user.user_metadata?.first_name || '',
          last_name: user.user_metadata?.last_name || ''
        })
        .select()
        .single();

      if (createError) {
        console.log('   ❌ Failed to create account:', createError.message);
      } else {
        console.log('   ✅ Account created successfully:', newAccount.email);
        
        // Also create account_users relationship
        const { error: linkError } = await supabase
          .from('account_users')
          .insert({
            account_id: userId,
            user_id: userId,
            role: 'owner',
            created_at: new Date().toISOString()
          });

        if (linkError) {
          console.log('   ❌ Failed to create account_users link:', linkError.message);
        } else {
          console.log('   ✅ Account_users link created successfully');
        }
      }
    } else if (account) {
      console.log('\n✅ Account exists:');
      console.log('   Email:', account.email);
      console.log('   Plan:', account.plan);
    }

    // Check account_users
    const { data: accountUsers } = await supabase
      .from('account_users')
      .select('*')
      .eq('user_id', userId);

    if (accountUsers && accountUsers.length > 0) {
      console.log('\n📊 Account_users relationships:', accountUsers.length);
      accountUsers.forEach(au => {
        console.log(`   - Account: ${au.account_id}, Role: ${au.role}`);
      });
    } else {
      console.log('\n⚠️  No account_users relationships found');
    }

    // Check for businesses
    const { data: businesses } = await supabase
      .from('businesses')
      .select('*')
      .eq('account_id', userId);

    if (businesses && businesses.length > 0) {
      console.log('\n🏢 Businesses:', businesses.length);
      businesses.forEach(b => {
        console.log(`   - ${b.name}`);
      });
    } else {
      console.log('\n⚠️  No businesses found');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkUserAccountIssue();