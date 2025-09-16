/**
 * Script to fix orphaned users by creating missing account and account_user records
 * This script manually creates the required records for users who can't sign in
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixOrphanedUsers() {
  console.log('🔧 Fixing orphaned users...');
  
  // List of orphaned users from the troubleshooting output
  const orphanedUsers = [
    {
      email: 'chris@murmurcreative.com',
      id: 'f6d8577b-9a1c-4789-b729-064a42fb005d'
    },
    {
      email: 'test@example.com', 
      id: '86cf5135-fd38-4380-b421-584465ca181b'
    }
  ];
  
  for (const user of orphanedUsers) {
    console.log(`\n🔧 Fixing user: ${user.email} (${user.id})`);
    
    try {
      // 1. Create account record
      console.log('🏢 Creating account record...');
      const { error: accountError } = await supabaseAdmin
        .from('accounts')
        .insert({
          id: user.id,
          trial_start: new Date().toISOString(),
          trial_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          is_free_account: false,
          custom_prompt_page_count: 0,
          contact_count: 0
        });
      
      if (accountError) {
        if (accountError.code === '23505') { // Unique violation
          console.log('✅ Account record already exists');
        } else {
          console.error('❌ Failed to create account:', accountError.message);
          continue;
        }
      } else {
        console.log('✅ Account record created');
      }
      
      // 2. Create account_user record
      console.log('👤 Creating account_user record...');
      const { error: accountUserError } = await supabaseAdmin
        .from('account_users')
        .insert({
          user_id: user.id,
          account_id: user.id,
          role: 'owner'
        });
      
      if (accountUserError) {
        if (accountUserError.code === '23505') { // Unique violation
          console.log('✅ Account_user record already exists');
        } else {
          console.error('❌ Failed to create account_user:', accountUserError.message);
          continue;
        }
      } else {
        console.log('✅ Account_user record created');
      }
      
      console.log(`✅ User ${user.email} fixed successfully`);
      
    } catch (error) {
      console.error(`❌ Error fixing user ${user.email}:`, error.message);
    }
  }
  
  console.log('\n✅ All orphaned users processed');
}

// Run the fix
fixOrphanedUsers().catch(console.error); 