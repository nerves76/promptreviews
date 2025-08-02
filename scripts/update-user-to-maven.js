const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function updateUserToMaven() {
  try {
    const targetEmail = 'chris@diviner.agency';
    console.log(`Updating ${targetEmail} to Maven tier...`);
    
    // First get the user ID for chris@diviner.agency
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();
    if (userError) {
      console.error('Error fetching users:', userError);
      return;
    }
    
    const user = users.users.find(u => u.email === targetEmail);
    if (!user) {
      console.log(`User ${targetEmail} not found`);
      return;
    }
    
    console.log('Found user:', { id: user.id, email: user.email });
    
    // Check if user has an account record
    const { data: existingAccount, error: accountFetchError } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (accountFetchError && accountFetchError.code !== 'PGRST116') {
      console.error('Error fetching account:', accountFetchError);
      return;
    }
    
    if (existingAccount) {
      console.log('Existing account found:', {
        id: existingAccount.id,
        plan: existingAccount.plan,
        is_free_account: existingAccount.is_free_account
      });
      
      // Update existing account to Maven
      const { data: updatedAccount, error: updateError } = await supabase
        .from('accounts')
        .update({
          plan: 'maven',
          is_free_account: true,
          free_plan_level: 'maven',
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single();
      
      if (updateError) {
        console.error('Error updating account:', updateError);
        return;
      }
      
      console.log('Account updated successfully:', updatedAccount);
    } else {
      console.log('No existing account found, creating new Maven account...');
      
      // Create new Maven account
      const { data: newAccount, error: createError } = await supabase
        .from('accounts')
        .insert({
          id: user.id,
          plan: 'maven',
          is_free_account: true,
          free_plan_level: 'maven',
          custom_prompt_page_count: 0,
          contact_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (createError) {
        console.error('Error creating account:', createError);
        return;
      }
      
      console.log('New Maven account created successfully:', newAccount);
    }
    
    // Verify the update
    const { data: verifyAccount, error: verifyError } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (verifyError) {
      console.error('Error verifying account update:', verifyError);
      return;
    }
    
    console.log('\n✅ SUCCESS! Account verification:');
    console.log('- Email:', targetEmail);
    console.log('- Plan:', verifyAccount.plan);
    console.log('- Free Account:', verifyAccount.is_free_account);
    console.log('- Free Plan Level:', verifyAccount.free_plan_level);
    console.log('- Location Limit: 10 (Maven tier)');
    console.log('- Prompt Page Limit: 500');
    console.log('- Contact Limit: 10,000');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

updateUserToMaven(); 