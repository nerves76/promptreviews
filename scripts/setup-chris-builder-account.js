const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupChrisAccount() {
  try {
    // Find Chris's account by email
    const { data: accounts, error: fetchError } = await supabase
      .from('accounts')
      .select('*')
      .eq('email', 'chris@diviner.agency');

    if (fetchError) {
      console.error('Error fetching account:', fetchError);
      return;
    }

    if (accounts.length === 0) {
      console.log('No account found for chris@diviner.agency. Please sign in first.');
      return;
    }

    const account = accounts[0];
    console.log('Found account:', account.id);

    // Update to builder plan
    const { data, error } = await supabase
      .from('accounts')
      .update({
        plan: 'builder',
        max_contacts: 1000,
        max_prompt_pages: 50,
        updated_at: new Date().toISOString()
      })
      .eq('id', account.id)
      .select();

    if (error) {
      console.error('Error updating account:', error);
      return;
    }

    console.log('✅ Successfully upgraded account to builder plan!');
    console.log('Account details:', data[0]);
  } catch (error) {
    console.error('Script error:', error);
  }
}

setupChrisAccount(); 