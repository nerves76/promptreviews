const { createClient } = require('@supabase/supabase-js');

// Replace with your actual values:
const SUPABASE_URL = 'https://ltneloufqjktdplodvao.supabase.co';
const SERVICE_ROLE_KEY = '***REMOVED***'; // <-- Replace with your service_role key from Supabase dashboard

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