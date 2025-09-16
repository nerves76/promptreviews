const { createClient } = require('@supabase/supabase-js');

// Supabase local configuration
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTestUser() {
  try {
    console.log('🔧 Creating test user account...');
    
    // Use admin API to create user
    const { data: user, error: userError } = await supabase.auth.admin.createUser({
      email: 'chris@diviner.agency',
      password: 'testpassword123',
      email_confirm: true,
      user_metadata: {
        first_name: 'Chris',
        last_name: 'Test'
      }
    });

    if (userError) {
      console.error('❌ Error creating user:', userError);
      return;
    }

    console.log('✅ User created successfully:', {
      id: user.user.id,
      email: user.user.email,
      confirmed: user.user.email_confirmed_at ? 'YES' : 'NO'
    });

    // Check if account was created by trigger
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', user.user.id)
      .single();

    if (accountError && accountError.code !== 'PGRST116') {
      console.error('❌ Error checking account:', accountError);
      return;
    }

    if (!account) {
      console.log('🔧 Account not found, creating manually...');
      
      // Create account manually
      const { data: newAccount, error: createAccountError } = await supabase
        .from('accounts')
        .insert({
          id: user.user.id,
          email: user.user.email,
          first_name: 'Chris',
          last_name: 'Test',
          plan: 'no_plan',
          trial_start: new Date().toISOString(),
          trial_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          is_free_account: false,
          custom_prompt_page_count: 0,
          contact_count: 0,
          review_notifications_enabled: true,
          user_id: user.user.id
        })
        .select()
        .single();

      if (createAccountError) {
        console.error('❌ Error creating account:', createAccountError);
        return;
      }

      console.log('✅ Account created manually');
    } else {
      console.log('✅ Account already exists (created by trigger)');
    }

    // Check account_users relationship
    const { data: accountUser, error: accountUserError } = await supabase
      .from('account_users')
      .select('*')
      .eq('user_id', user.user.id)
      .eq('account_id', user.user.id)
      .single();

    if (accountUserError && accountUserError.code !== 'PGRST116') {
      console.error('❌ Error checking account_users:', accountUserError);
      return;
    }

    if (!accountUser) {
      console.log('🔧 Account_users relationship not found, creating...');
      
      const { error: createAccountUserError } = await supabase
        .from('account_users')
        .insert({
          account_id: user.user.id,
          user_id: user.user.id,
          role: 'owner'
        });

      if (createAccountUserError) {
        console.error('❌ Error creating account_users:', createAccountUserError);
        return;
      }

      console.log('✅ Account_users relationship created');
    } else {
      console.log('✅ Account_users relationship already exists');
    }

    console.log('');
    console.log('🎉 SUCCESS! Test account is ready:');
    console.log('📧 Email: chris@diviner.agency');
    console.log('🔑 Password: testpassword123');
    console.log('');
    console.log('You can now sign in at: http://localhost:3002/auth/sign-in');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

createTestUser();