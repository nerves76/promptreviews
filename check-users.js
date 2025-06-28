/**
 * Check Users Script
 * 
 * This script checks for existing users in the Supabase database
 * to help debug authentication issues.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

async function checkUsers() {
  try {
    console.log('Creating Supabase admin client...');
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    console.log('Checking for existing users...');
    
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
    console.log(`Found ${data.users?.length || 0} users in the database:`);
    
    if (data.users && data.users.length > 0) {
      data.users.forEach((user, index) => {
        console.log(`\nUser ${index + 1}:`);
        console.log(`  ID: ${user.id}`);
        console.log(`  Email: ${user.email}`);
        console.log(`  Email Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`);
        console.log(`  Created: ${user.created_at}`);
        console.log(`  Last Sign In: ${user.last_sign_in_at || 'Never'}`);
      });
    } else {
      console.log('No users found in the database.');
    }
    
    // Also check the accounts table
    console.log('\nChecking accounts table...');
    const { data: accounts, error: accountsError } = await supabaseAdmin
      .from('accounts')
      .select('*');
      
    if (accountsError) {
      console.error('Error fetching accounts:', accountsError);
    } else {
      console.log(`Found ${accounts?.length || 0} accounts in the database:`);
      if (accounts && accounts.length > 0) {
        accounts.forEach((account, index) => {
          console.log(`\nAccount ${index + 1}:`);
          console.log(`  ID: ${account.id}`);
          console.log(`  Email: ${account.email}`);
          console.log(`  First Name: ${account.first_name}`);
          console.log(`  Last Name: ${account.last_name}`);
          console.log(`  Created: ${account.created_at}`);
        });
      }
    }
    
  } catch (error) {
    console.error('Error checking users:', error);
  }
}

checkUsers(); 