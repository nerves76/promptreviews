require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testBusinessesSchema() {
  try {
    console.log('Testing businesses table schema...');
    
    // Get all columns from businesses table
    const { data: columns, error: columnsError } = await supabase
      .from('businesses')
      .select('*')
      .limit(1);

    if (columnsError) {
      console.error('Error getting columns:', columnsError);
      return;
    }

    console.log('✅ Businesses table accessible');
    console.log('Available columns:', Object.keys(columns[0] || {}));
    
    // Check if there are any businesses
    const { data: allBusinesses, error: allError } = await supabase
      .from('businesses')
      .select('*');

    if (allError) {
      console.error('Error getting all businesses:', allError);
    } else {
      console.log('Total businesses:', allBusinesses?.length || 0);
      if (allBusinesses && allBusinesses.length > 0) {
        console.log('Sample business:', allBusinesses[0]);
      }
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testBusinessesSchema(); 