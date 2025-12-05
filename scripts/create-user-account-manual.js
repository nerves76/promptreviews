const { createClient } = require('@supabase/supabase-js');

async function createUserAccountManually() {
  const supabase = createClient(
    'http://127.0.0.1:54321',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
  );

  const email = 'boltro3000@gmail.com';
  
  try {
    // 1. Get the user from auth.users
    const { data: users, error: userError } = await supabase
      .from('auth.users')
      .select('*')
      .eq('email', email);
    
    if (userError) {
      console.log('❌ Error fetching user:', userError);
      return;
    }
    
    if (!users || users.length === 0) {
      console.log('❌ User not found in auth.users');
      return;
    }
    
    const user = users[0];
    console.log('✅ Found user:', user.id, user.email, 'confirmed:', user.email_confirmed_at);
    
    // 2. Check if account already exists
    const { data: existingAccount, error: accountCheckError } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', user.id);
    
    if (accountCheckError) {
      console.log('Error checking account:', accountCheckError);
    }
    
    if (existingAccount && existingAccount.length > 0) {
      console.log('✅ Account already exists:', existingAccount[0].id);
      return;
    }
    
    // 3. Create account record
    const { data: newAccount, error: accountError } = await supabase
      .from('accounts')
      .insert({
        user_id: user.id,
        email: user.email,
        first_name: 'Test',
        last_name: 'User',
        plan: 'free',
        subscription_status: 'active'
      })
      .select()
      .single();
    
    if (accountError) {
      console.log('❌ Error creating account:', accountError);
      return;
    }
    
    console.log('✅ Created account:', newAccount.id);
    
    // 4. Create account_users record
    const { data: accountUser, error: accountUserError } = await supabase
      .from('account_users')
      .insert({
        account_id: newAccount.id,
        user_id: user.id,
        role: 'owner'
      })
      .select()
      .single();
    
    if (accountUserError) {
      console.log('❌ Error creating account_user:', accountUserError);
      return;
    }
    
    console.log('✅ Created account_user:', accountUser.id);
    console.log('🎉 User account setup complete! Try signing in now.');
    
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

createUserAccountManually(); 