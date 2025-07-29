// -----------------------------------------------------------------------------
// Check and Fix Maven Location Limits
// This script checks if Maven accounts have the correct location limits set
// and fixes any accounts that don't have the proper max_locations value.
// -----------------------------------------------------------------------------

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  console.error('Available env vars:', Object.keys(process.env).filter(key => key.includes('SUPABASE')));
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAndFixMavenLocationLimits() {
  console.log('🔍 Checking Maven accounts for location limits...');
  
  try {
    // Get all Maven accounts
    const { data: mavenAccounts, error: fetchError } = await supabase
      .from('accounts')
      .select('id, email, plan, location_count, max_locations, created_at')
      .eq('plan', 'maven');
    
    if (fetchError) {
      console.error('❌ Error fetching Maven accounts:', fetchError);
      return;
    }
    
    console.log(`📊 Found ${mavenAccounts.length} Maven accounts`);
    
    let fixedCount = 0;
    let alreadyCorrectCount = 0;
    
    for (const account of mavenAccounts) {
      console.log(`\n🔍 Checking account: ${account.email}`);
      console.log(`   Plan: ${account.plan}`);
      console.log(`   Current location_count: ${account.location_count}`);
      console.log(`   Current max_locations: ${account.max_locations}`);
      
      if (account.max_locations !== 10) {
        console.log(`   ❌ Incorrect max_locations! Should be 10, but is ${account.max_locations}`);
        
        // Fix the max_locations
        const { error: updateError } = await supabase
          .from('accounts')
          .update({ max_locations: 10 })
          .eq('id', account.id);
        
        if (updateError) {
          console.error(`   ❌ Failed to update account ${account.email}:`, updateError);
        } else {
          console.log(`   ✅ Fixed max_locations to 10`);
          fixedCount++;
        }
      } else {
        console.log(`   ✅ max_locations is already correct (10)`);
        alreadyCorrectCount++;
      }
    }
    
    console.log(`\n📈 Summary:`);
    console.log(`   Total Maven accounts: ${mavenAccounts.length}`);
    console.log(`   Already correct: ${alreadyCorrectCount}`);
    console.log(`   Fixed: ${fixedCount}`);
    
    if (fixedCount > 0) {
      console.log(`\n✅ Successfully fixed ${fixedCount} Maven accounts`);
    } else {
      console.log(`\n✅ All Maven accounts already have correct location limits`);
    }
    
  } catch (error) {
    console.error('❌ Error in checkAndFixMavenLocationLimits:', error);
  }
}

// Run the check
checkAndFixMavenLocationLimits()
  .then(() => {
    console.log('\n🏁 Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }); 