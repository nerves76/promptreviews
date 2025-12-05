const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function makeAdmin() {
  const { data, error } = await supabase
    .from('accounts')
    .update({ 
      is_admin: true, 
      plan: 'maven',
      trial_start: new Date().toISOString(),
      trial_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    })
    .eq('email', 'chris@diviner.agency')
    .select();
    
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('✅ Updated:', data);
  }
}

makeAdmin();