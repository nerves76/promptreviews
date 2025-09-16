/**
 * Check Database Schema
 * 
 * This script checks the database schema to understand table relationships
 * and identify the foreign key constraint issue.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'http://localhost:54321';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

async function checkTables() {
  console.log('🔍 Checking database tables...');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  try {
    // Check if users table exists
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (usersError) {
      console.log('❌ Users table error:', usersError.message);
    } else {
      console.log('✅ Users table exists');
      console.log('📊 Users count:', users?.length || 0);
    }
    
    // Check if auth.users exists (this is Supabase Auth)
    console.log('\n🔐 Checking auth.users...');
    const { data: authUsers, error: authUsersError } = await supabase
      .from('auth.users')
      .select('*')
      .limit(1);
    
    if (authUsersError) {
      console.log('❌ Auth users table error:', authUsersError.message);
    } else {
      console.log('✅ Auth users table exists');
      console.log('📊 Auth users count:', authUsers?.length || 0);
    }
    
    // Check accounts table structure
    console.log('\n📋 Checking accounts table structure...');
    const { data: accounts, error: accountsError } = await supabase
      .from('accounts')
      .select('*')
      .limit(1);
    
    if (accountsError) {
      console.log('❌ Accounts table error:', accountsError.message);
    } else {
      console.log('✅ Accounts table exists');
      console.log('📊 Accounts count:', accounts?.length || 0);
      if (accounts && accounts.length > 0) {
        console.log('📋 Account columns:', Object.keys(accounts[0]));
      }
    }
    
  } catch (err) {
    console.error('❌ Exception checking tables:', err);
  }
}

async function checkForeignKeys() {
  console.log('\n🔗 Checking foreign key constraints...');
  
  // The issue is that accounts.id has a foreign key to users.id
  // but the user is in auth.users, not users table
  
  console.log('❌ Problem identified:');
  console.log('   - accounts.id has foreign key constraint to users.id');
  console.log('   - But users are stored in auth.users (Supabase Auth)');
  console.log('   - This creates a mismatch in the schema');
}

async function suggestFix() {
  console.log('\n🔧 Suggested fixes:');
  console.log('1. Remove the foreign key constraint from accounts.id to users.id');
  console.log('2. Or create a users table that mirrors auth.users');
  console.log('3. Or modify the accounts table to not use foreign key constraint');
  console.log('4. Or use a different field for the foreign key relationship');
}

async function main() {
  console.log('🚀 Starting database schema analysis...\n');
  
  await checkTables();
  await checkForeignKeys();
  await suggestFix();
  
  console.log('\n✅ Schema analysis completed');
}

main().catch(console.error); 