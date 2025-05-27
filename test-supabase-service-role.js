const { createClient } = require('@supabase/supabase-js');

// Replace with your actual values:
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY'; // <-- Use env variable, do not hardcode

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function fetchAccount() {
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('id', 'f3fa0bb0-feab-4501-8644-c0ca579da96d')
    .single();

  console.log('Data:', data);
  console.log('Error:', error);
}

fetchAccount();
// DO NOT COMMIT REAL SERVICE ROLE KEYS. Use environment variables instead. 