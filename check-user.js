/**
 * Check if user exists in database
 * 
 * This script checks if a specific user exists in the auth.users table
 * and if they have a corresponding account record
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ltneloufqjktdplodvao.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0bmVsb3VmcWprdGRwbG9kdmFvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODA0MTU3OCwiZXhwIjoyMDYzNjE3NTc4fQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

async function checkUser() {
  console.log('🔍 Checking if user exists...');
  
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Check if user exists in auth.users using direct query
    const { data: authUsers, error: authError } = await supabase
      .from('auth.users')
      .select('*')
      .eq('email', 'nerves76@gmail.com')
      .single();
    
    if (authError) {
      console.log('❌ Auth error:', authError);
      return;
    }
    
    if (!authUsers) {
      console.log('❌ User not found in auth.users table');
      return;
    }
    
    console.log('✅ User found in auth.users:');
    console.log('  ID:', authUsers.id);
    console.log('  Email:', authUsers.email);
    console.log('  Email confirmed:', authUsers.email_confirmed_at);
    console.log('  Created at:', authUsers.created_at);
    
    // Check if user has an account record
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', authUsers.id)
      .single();
    
    if (accountError) {
      console.log('❌ Account lookup error:', accountError);
      return;
    }
    
    if (!account) {
      console.log('❌ No account record found for user');
      return;
    }
    
    console.log('✅ Account record found:');
    console.log('  Account ID:', account.id);
    console.log('  Business name:', account.business_name);
    console.log('  Plan:', account.plan);
    console.log('  Created at:', account.created_at);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkUser(); 