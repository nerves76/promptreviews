const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  console.log('SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.log('SERVICE_KEY:', supabaseServiceKey ? 'Set' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function upgradeAccount() {
  try {
    console.log('🔍 Looking for account with email: nerves76@gmail.com');
    
    // First, find the user by email
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error('❌ Error fetching users:', userError);
      return;
    }
    
    const user = users.users.find(u => u.email === 'nerves76@gmail.com');
    
    if (!user) {
      console.error('❌ User not found with email: nerves76@gmail.com');
      console.log('Available users:', users.users.map(u => u.email));
      return;
    }
    
    console.log('✅ Found user:', user.id);
    
    // Update the account to Maven plan
    const { data, error } = await supabase
      .from('accounts')
      .update({ 
        plan: 'maven',
        has_had_paid_plan: true,
        subscription_status: 'active'
      })
      .eq('id', user.id)
      .select();
    
    if (error) {
      console.error('❌ Error updating account:', error);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('🎉 Successfully upgraded account to Maven!');
      console.log('Updated account data:', data[0]);
    } else {
      console.log('⚠️  No account found to update - account may not exist yet');
      
      // Try to create the account if it doesn't exist
      console.log('🔄 Attempting to create account record...');
      const { data: newAccount, error: createError } = await supabase
        .from('accounts')
        .insert({ 
          id: user.id,
          plan: 'maven',
          has_had_paid_plan: true,
          subscription_status: 'active',
          email: user.email
        })
        .select();
        
      if (createError) {
        console.error('❌ Error creating account:', createError);
      } else {
        console.log('🎉 Created new Maven account!', newAccount[0]);
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

upgradeAccount(); 