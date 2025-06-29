/**
 * Check Users Script
 * 
 * This script checks for existing users in the Supabase database
 * to help debug authentication issues.
 */

const { createClient } = require('@supabase/supabase-js');

// Local Supabase configuration
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUsers() {
  try {
    console.log('Checking users in local Supabase...');
    
    // Use the admin API to list all users
    const adminUrl = `${supabaseUrl}/auth/v1/admin/users`;
    const response = await fetch(adminUrl, {
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to fetch users:', response.status, errorText);
      return;
    }
    
    const data = await response.json();
    console.log(`Found ${data.users?.length || 0} users:`);
    
    if (data.users && data.users.length > 0) {
      data.users.forEach(user => {
        console.log(`- ${user.email} (${user.id}) - Created: ${user.created_at}`);
      });
    } else {
      console.log('No users found in the database.');
    }
    
    // Also check accounts table
    console.log('\nChecking accounts table...');
    const { data: accounts, error: accountsError } = await supabase
      .from('accounts')
      .select('id, email, business_name, created_at')
      .order('created_at', { ascending: false });
    
    if (accountsError) {
      console.error('Error fetching accounts:', accountsError);
      return;
    }
    
    console.log(`Found ${accounts.length} accounts:`);
    accounts.forEach(account => {
      console.log(`- ${account.email} (${account.id}) - Business: ${account.business_name} - Created: ${account.created_at}`);
    });
    
  } catch (error) {
    console.error('Script error:', error);
  }
}

checkUsers(); 