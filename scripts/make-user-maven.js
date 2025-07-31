/**
 * Simple script to make an existing user a Maven
 * Usage: node scripts/make-user-maven.js
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function makeUserMaven() {
  try {
    console.log('🔧 Looking for user to upgrade to Maven...');
    
    // Find the user by email
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error('❌ Error fetching users:', userError);
      return;
    }
    
    // Find the most recent user (likely the one you just created)
    const recentUser = users.users.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];
    
    if (!recentUser) {
      console.log('❌ No users found');
      return;
    }
    
    console.log(`✅ Found user: ${recentUser.email} (ID: ${recentUser.id})`);
    
    // Find or create account for this user
    const { data: accountUsers, error: accountUserError } = await supabase
      .from('account_users')
      .select('account_id')
      .eq('user_id', recentUser.id);
    
    let accountId;
    
    if (accountUserError || !accountUsers || accountUsers.length === 0) {
      console.log('⚠️  No account found, creating one...');
      
      // Create account
      const { data: account, error: accountError } = await supabase
        .from('accounts')
        .insert({
          id: recentUser.id,
          plan: 'maven',
          business_name: 'Diviner Agency',
          email: recentUser.email,
          first_name: 'Chris',
          last_name: 'Bolton',
          is_free_account: false,
          has_had_paid_plan: true,
          plan_lookup_key: 'maven',
          review_notifications_enabled: true,
        })
        .select()
        .single();
      
      if (accountError) {
        console.error('❌ Error creating account:', accountError);
        return;
      }
      
      accountId = account.id;
      console.log(`✅ Created account: ${account.business_name} (ID: ${account.id})`);
      
      // Create account_user relationship
      const { error: accountUserCreateError } = await supabase
        .from('account_users')
        .insert({
          account_id: accountId,
          user_id: recentUser.id,
          role: 'owner',
        });
      
      if (accountUserCreateError) {
        console.error('❌ Error creating account_user relationship:', accountUserCreateError);
        return;
      }
      
      console.log('✅ Created account_user relationship');
      
    } else {
      accountId = accountUsers[0].account_id;
      console.log(`✅ Found existing account: ${accountId}`);
      
      // Update existing account to Maven
      const { error: updateError } = await supabase
        .from('accounts')
        .update({
          plan: 'maven',
          is_free_account: false,
          has_had_paid_plan: true,
          plan_lookup_key: 'maven',
        })
        .eq('id', accountId);
      
      if (updateError) {
        console.error('❌ Error updating account:', updateError);
        return;
      }
      
      console.log('✅ Updated account to Maven plan');
    }
    
    console.log('\n🎉 Successfully upgraded user to Maven!');
    console.log('📧 Email:', recentUser.email);
    console.log('📊 Plan: Maven');
    console.log('📍 Account ID:', accountId);
    console.log('\nYou can now create up to 10 locations!');
    
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

makeUserMaven(); 