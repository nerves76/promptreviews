// -----------------------------------------------------------------------------
// Debug Location Limits
// This script checks the current state of location limits for debugging
// -----------------------------------------------------------------------------

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugLocationLimits() {
  console.log('🔍 Debugging location limits...');
  
  try {
    // Find the Maven account for chris@diviner.agency
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();
    
    const user = users.users.find(u => u.email === 'chris@diviner.agency');
    if (!user) {
      console.error('❌ User not found');
      return;
    }

    const userId = user.id;
    console.log('✅ Found user ID:', userId);

    // Get account data
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', userId)
      .single();

    if (accountError || !account) {
      console.error('❌ Account not found:', accountError);
      return;
    }

    console.log('📊 Account data:');
    console.log('  Plan:', account.plan);
    console.log('  Location count:', account.location_count);
    console.log('  Max locations:', account.max_locations);
    console.log('  Can create more:', account.location_count < account.max_locations);

    // Get business locations
    const { data: locations, error: locationsError } = await supabase
      .from('business_locations')
      .select('*')
      .eq('account_id', userId);

    if (locationsError) {
      console.error('❌ Error fetching locations:', locationsError);
      return;
    }

    console.log('📍 Business locations:', locations?.length || 0);
    
    if (locations && locations.length > 0) {
      console.log('  Location names:', locations.map(l => l.name));
    }

    // Check if the account can create more locations
    const canCreateMore = account.location_count < account.max_locations;
    console.log('\n🎯 Can create more locations:', canCreateMore);
    
    if (!canCreateMore) {
      console.log('❌ Location limit reached!');
      console.log('  Current:', account.location_count);
      console.log('  Max:', account.max_locations);
    } else {
      console.log('✅ Can create more locations!');
      console.log('  Remaining:', account.max_locations - account.location_count);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugLocationLimits(); 