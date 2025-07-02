const { createClient } = require('@supabase/supabase-js');

async function createAccountViaRPC() {
  const supabase = createClient(
    'http://127.0.0.1:54321',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
  );

  try {
    console.log('🎯 Manually triggering handle_new_user function...');
    
    // Call the handle_new_user function directly
    const { data, error } = await supabase.rpc('handle_new_user', {
      user_id: '00000000-0000-0000-0000-000000000000', // We'll get the real ID later
      user_email: 'boltro3000@gmail.com',
      user_metadata: {
        first_name: 'Test',
        last_name: 'User'
      }
    });
    
    if (error) {
      console.log('❌ RPC Error:', error);
      
      // Let's try a different approach - check if we can create account directly
      console.log('🔄 Trying direct account creation...');
      
      // Create account record manually
      const { data: newAccount, error: accountError } = await supabase
        .from('accounts')
        .insert({
          email: 'boltro3000@gmail.com',
          first_name: 'Test',
          last_name: 'User',
          plan: 'free',
          subscription_status: 'active'
        })
        .select()
        .single();
      
      if (accountError) {
        console.log('❌ Account creation error:', accountError);
        return;
      }
      
      console.log('✅ Created account:', newAccount);
      console.log('🎉 Try signing in now!');
      
    } else {
      console.log('✅ RPC Success:', data);
      console.log('🎉 Account created via handle_new_user! Try signing in now.');
    }
    
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

createAccountViaRPC(); 