const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const email = 'nerves76@gmail.com';
const password = 'Prcamus9721!';
const first_name = 'Chris';
const last_name = 'Nerves';

async function ensureTestUser() {
  console.log('Setting up test user...');
  let userId;
  try {
    // List all users and find by email
    let foundUser = null;
    let nextPage = null;
    do {
      const { data, error } = await supabase.auth.admin.listUsers({ page: nextPage });
      if (error) throw error;
      foundUser = data.users.find(u => u.email === email);
      nextPage = data.nextPage;
    } while (!foundUser && nextPage);

    if (foundUser) {
      userId = foundUser.id;
      // Update password and confirm email
      console.log('Updating existing user password and confirming email...');
      const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
        password,
        email_confirm: true,
        user_metadata: { first_name, last_name }
      });
      if (updateError) {
        console.log('❌ Error updating user:', updateError);
        return;
      }
      console.log('✅ User password updated and email confirmed.');
    } else {
      // Create new user
      console.log('Creating new user...');
      const { data: userData, error: userError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { first_name, last_name }
      });
      if (userError) {
        console.log('❌ Error creating user:', userError);
        return;
      }
      userId = userData.user.id;
      console.log('✅ User created:', userData.user.email);
    }

    // Ensure account record
    const { data: existingAccount } = await supabase
      .from('accounts')
      .select('id')
      .eq('id', userId)
      .single();
    if (!existingAccount) {
      const { error: accountError } = await supabase
        .from('accounts')
        .insert({
          id: userId,
          email,
          first_name,
          last_name,
          trial_start: new Date().toISOString(),
          trial_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          is_free_account: false,
          custom_prompt_page_count: 0,
          contact_count: 0,
          plan: 'grower',
          max_users: 1
        });
      if (accountError) {
        console.log('❌ Error creating account:', accountError);
      } else {
        console.log('✅ Account record created.');
      }
    } else {
      console.log('✅ Account record already exists.');
    }

    // Ensure account_user record
    const { data: existingAccountUser } = await supabase
      .from('account_users')
      .select('user_id')
      .eq('user_id', userId)
      .eq('account_id', userId)
      .single();
    if (!existingAccountUser) {
      const { error: accountUserError } = await supabase
        .from('account_users')
        .insert({
          user_id: userId,
          account_id: userId,
          role: 'owner'
        });
      if (accountUserError) {
        console.log('❌ Error creating account_user:', accountUserError);
      } else {
        console.log('✅ Account user record created.');
      }
    } else {
      console.log('✅ Account user record already exists.');
    }

    console.log('\n🎉 Test user setup complete!');
    console.log('Email:', email);
    console.log('Password:', password);
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

ensureTestUser(); 