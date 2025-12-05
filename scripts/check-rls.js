const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321',
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function checkRLS() {
  console.log('Checking database configuration...\n');
  
  // Check RLS status with raw SQL
  const { data: rlsData, error: rlsError } = await supabase.rpc('exec_sql', {
    query: `
      SELECT tablename, rowsecurity 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename IN ('accounts', 'account_users')
    `
  }).single();
  
  if (rlsError) {
    // Try direct query
    console.log('Checking with direct queries...');
    
    // Check accounts table
    const { data: accounts, error: accError } = await supabase
      .from('accounts')
      .select('count')
      .limit(1);
      
    console.log('Accounts table accessible:', !accError);
    if (accError) console.log('  Error:', accError.message);
    
    // Check account_users table  
    const { data: accountUsers, error: auError } = await supabase
      .from('account_users')
      .select('count')
      .limit(1);
      
    console.log('Account_users table accessible:', !auError);
    if (auError) console.log('  Error:', auError.message);
  } else {
    console.log('RLS Status:', rlsData);
  }
  
  // Check for the user
  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
  
  if (!userError && users) {
    const chris = users.find(u => u.email === 'chris@diviner.agency');
    if (chris) {
      console.log('\nUser found:', chris.id);
      
      // Check account
      const { data: account, error: accountError } = await supabase
        .from('accounts')
        .select('*')
        .eq('id', chris.id)
        .single();
        
      console.log('Account exists:', !!account && !accountError);
      if (accountError) console.log('  Error:', accountError.message);
      
      // Check account_users
      const { data: au, error: auError } = await supabase
        .from('account_users')
        .select('*')
        .eq('user_id', chris.id)
        .single();
        
      console.log('Account_users exists:', !!au && !auError);
      if (auError) console.log('  Error:', auError.message);
    }
  }
}

checkRLS();