/**
 * Script to upgrade Chris's account to builder plan
 * 
 * This will allow testing of the manual contact creation feature
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function upgradeChrisToBuilder() {
  try {
    console.log('🔄 Upgrading Chris to builder plan...');
    
    // Update Chris's account to builder plan
    const { data, error } = await supabase
      .from('accounts')
      .update({
        plan: 'builder',
        max_contacts: 1000, // Builder plan limit
        max_prompt_pages: 10 // Builder plan limit
      })
      .eq('user_id', 'a5442dee-9478-4714-9c02-b7a74c1128d1')
      .select();

    if (error) {
      console.error('❌ Error upgrading account:', error);
      return;
    }

    console.log('✅ Account upgraded successfully!');
    console.log('📊 New account details:', data[0]);
    console.log('🎯 Chris can now add contacts and test the manual contact feature!');
    
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

upgradeChrisToBuilder(); 