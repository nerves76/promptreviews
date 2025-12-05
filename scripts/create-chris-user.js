const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createChrisUser() {
  console.log('Creating Chris user...');
  
  try {
    // Create the user
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: 'chris@diviner.agency',
      password: 'password123',
      email_confirm: true,
      user_metadata: {
        first_name: 'Chris',
        last_name: 'Bolton'
      }
    });
    
    if (userError) {
      console.log('❌ Error creating user:', userError);
      return;
    }
    
    console.log('✅ Chris user created successfully:', userData.user.email);
    console.log('User ID:', userData.user.id);
    
    // Link user to the account that owns the prompt page
    const accountId = '7e061712-8636-436d-a187-9bfb18c0985e';
    
    const { data: accountUserData, error: accountUserError } = await supabase
      .from('account_users')
      .insert({
        account_id: accountId,
        user_id: userData.user.id,
        role: 'owner'
      })
      .select();
    
    if (accountUserError) {
      console.log('❌ Error linking user to account:', accountUserError);
    } else {
      console.log('✅ User linked to account successfully');
      console.log('Account User ID:', accountUserData[0].id);
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

createChrisUser(); 