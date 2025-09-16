const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function upgradeToMaven() {
  try {
    // First, find the user
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error('Error fetching users:', userError);
      return;
    }
    
    const user = userData.users.find(u => u.email === 'chris@diviner.agency');
    
    if (!user) {
      console.error('User chris@diviner.agency not found');
      return;
    }
    
    console.log('Found user:', user.email, 'ID:', user.id);
    
    // Find the user's account
    const { data: accountData, error: accountError } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', user.id)
      .single();
      
    if (accountError) {
      console.error('Error fetching account:', accountError);
      return;
    }
    
    console.log('Current account plan:', accountData.plan);
    console.log('Current max locations:', accountData.max_locations);
    console.log('Current max contacts:', accountData.max_contacts);
    console.log('Current max prompt pages:', accountData.max_prompt_pages);
    
    // Update to Maven plan
    const { data: updateData, error: updateError } = await supabase
      .from('accounts')
      .update({ 
        plan: 'maven',
        max_locations: 10,
        max_contacts: 1000,
        max_prompt_pages: 100,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()
      .single();
      
    if (updateError) {
      console.error('Error updating account:', updateError);
      return;
    }
    
    console.log('✅ Successfully upgraded to Maven!');
    console.log('New plan:', updateData.plan);
    console.log('New max locations:', updateData.max_locations);
    console.log('New max contacts:', updateData.max_contacts);
    console.log('New max prompt pages:', updateData.max_prompt_pages);
    
    // Also update account_users table if it exists
    const { data: accountUserData, error: accountUserError } = await supabase
      .from('account_users')
      .update({ 
        plan: 'maven',
        updated_at: new Date().toISOString()
      })
      .eq('account_id', user.id)
      .eq('user_id', user.id)
      .select();
      
    if (!accountUserError && accountUserData) {
      console.log('✅ Also updated account_users table');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

upgradeToMaven();