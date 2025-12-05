const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
);

async function createAccountForUser() {
  try {
    console.log('Creating account for authenticated user...');
    
    // Get current user (you'll need to be logged in)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('No authenticated user found:', userError);
      console.log('Please make sure you are logged into the application first.');
      return;
    }
    
    console.log('Found user:', user.id, user.email);
    
    // Check if account already exists
    const { data: existingAccount, error: checkError } = await supabase
      .from('accounts')
      .select('id')
      .eq('id', user.id)
      .single();
      
    if (!checkError && existingAccount) {
      console.log('Account already exists!');
      return;
    }
    
    // Create account
    const { data: newAccount, error: createError } = await supabase
      .from('accounts')
      .insert({
        id: user.id,
        email: user.email,
        plan: 'no_plan',
        trial_start: new Date().toISOString(),
        trial_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        is_free_account: false,
        custom_prompt_page_count: 0,
        contact_count: 0,
        first_name: user.user_metadata?.first_name || '',
        last_name: user.user_metadata?.last_name || '',
        has_seen_welcome: false,
        review_notifications_enabled: true,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating account:', createError);
      return;
    }

    // Create account_users relationship
    const { error: accountUserError } = await supabase
      .from('account_users')
      .insert({
        user_id: user.id,
        account_id: user.id,
        role: 'owner',
      });

    if (accountUserError) {
      console.error('Error creating account_users relationship:', accountUserError);
      return;
    }

    console.log('✅ Account created successfully!');
    console.log('You can now refresh the page and should be able to access the dashboard.');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

createAccountForUser();