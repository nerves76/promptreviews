const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client for local development
const supabase = createClient(
  'http://localhost:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
);

async function checkTableSchema(tableName) {
  try {
    // Use a SQL query to get the table structure
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = '${tableName}' AND table_schema = 'public' ORDER BY ordinal_position;`
    });

    if (error) {
      console.error(`Error fetching table structure for ${tableName}:`, error);
      return;
    }

    if (!data || data.length === 0) {
      console.log(`Table ${tableName} does not exist or has no columns.`);
      return;
    }

    console.log(`CURRENT TABLE STRUCTURE: ${tableName}`);
    console.log('================================');
    console.log('Columns:');
    data.forEach(col => {
      const nullable = col.is_nullable === 'YES' ? 'NULLABLE' : 'NOT NULL';
      const def = col.column_default ? `DEFAULT ${col.column_default}` : '';
      console.log(`  - ${col.column_name} (${col.data_type}) ${nullable} ${def}`);
    });
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

// Run for ai_usage table
checkTableSchema('ai_usage');

async function checkAccountsSchema() {
  try {
    // Try to select from the table to see what columns are available
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .limit(0);

    if (error) {
      console.error('Error accessing accounts table:', error);
      return;
    }

    console.log('✅ Accounts table is accessible');
    
    // Try to insert a test record with all the columns from your list
    const testData = {
      id: '00000000-0000-0000-0000-000000000000',
      business_name: 'Test Business',
      created_at: new Date().toISOString(),
      plan: 'grower',
      trial_start: new Date().toISOString(),
      trial_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      custom_prompt_page_count: 0,
      contact_count: 0,
      first_name: 'Test',
      last_name: 'User',
      stripe_customer_id: 'cus_test123',
      stripe_subscription_id: 'sub_test123',
      subscription_status: 'active',
      is_free_account: false,
      has_had_paid_plan: false,
      email: 'test@example.com',
      plan_lookup_key: 'grower',
      review_notifications_enabled: true,
      user_id: '00000000-0000-0000-0000-000000000000',
      has_seen_welcome: false
    };

    const { error: insertError } = await supabase
      .from('accounts')
      .insert(testData);

    if (insertError) {
      console.log('❌ Insert error (this helps us identify missing columns):', insertError.message);
      
      // Parse the error to identify missing columns
      if (insertError.message.includes('column') && insertError.message.includes('does not exist')) {
        console.log('\nThis suggests some columns in your list are missing from the table.');
      }
    } else {
      console.log('✅ Test insert successful - all columns exist!');
    }

  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

checkAccountsSchema(); 