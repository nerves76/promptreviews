// -----------------------------------------------------------------------------
// Verify Maven Location Limits
// This script verifies that Maven accounts have the correct location limits set
// -----------------------------------------------------------------------------

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyMavenLocationLimits() {
  console.log('🔍 Verifying Maven accounts location limits...');
  
  try {
    // Get all Maven accounts
    const { data: mavenAccounts, error: fetchError } = await supabase
      .from('accounts')
      .select('id, email, plan, location_count, max_locations')
      .eq('plan', 'maven');
    
    if (fetchError) {
      console.error('❌ Error fetching Maven accounts:', fetchError);
      return;
    }
    
    console.log(`📊 Found ${mavenAccounts.length} Maven accounts`);
    
    for (const account of mavenAccounts) {
      console.log(`\n🔍 Account: ${account.email}`);
      console.log(`   Plan: ${account.plan}`);
      console.log(`   Location count: ${account.location_count}`);
      console.log(`   Max locations: ${account.max_locations}`);
      console.log(`   Can create more: ${account.location_count < account.max_locations ? '✅ Yes' : '❌ No'}`);
    }
    
    console.log(`\n✅ Verification completed`);
    
  } catch (error) {
    console.error('❌ Error in verifyMavenLocationLimits:', error);
  }
}

// Run the verification
verifyMavenLocationLimits()
  .then(() => {
    console.log('\n🏁 Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }); 