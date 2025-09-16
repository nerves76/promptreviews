#!/usr/bin/env npx tsx
/**
 * Test script for account creation flow with RLS enabled
 * Tests: Signup -> Login -> Create Business -> Select Plan
 */

import { createClient } from '@supabase/supabase-js';
import { faker } from '@faker-js/faker';

// Use local Supabase instance
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002';

// Test user details
const testUser = {
  email: faker.internet.email().toLowerCase(),
  password: 'TestPass123!',
  firstName: faker.person.firstName(),
  lastName: faker.person.lastName(),
};

// Test business details
const testBusiness = {
  businessName: faker.company.name(),
  streetAddress: faker.location.streetAddress(),
  city: faker.location.city(),
  state: faker.location.state({ abbreviated: true }),
  zip: faker.location.zipCode('#####'),
  phone: faker.phone.number('###-###-####'),
  website: faker.internet.url(),
  aboutUs: faker.company.catchPhrase(),
};

console.log('🧪 Starting Account Creation Test');
console.log('================================');
console.log('Test User:', testUser.email);
console.log('Test Business:', testBusiness.businessName);
console.log('');

// Create clients
const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function cleanup() {
  console.log('🧹 Cleaning up test data...');
  
  try {
    // Get user ID
    const { data: userData } = await serviceClient.auth.admin.listUsers();
    const testUserData = userData?.users?.find(u => u.email === testUser.email);
    
    if (testUserData) {
      // Delete account_users records
      await serviceClient
        .from('account_users')
        .delete()
        .eq('user_id', testUserData.id);
      
      // Delete account
      await serviceClient
        .from('accounts')
        .delete()
        .eq('id', testUserData.id);
      
      // Delete user
      await serviceClient.auth.admin.deleteUser(testUserData.id);
      
      console.log('✅ Cleanup completed');
    }
  } catch (error) {
    console.log('⚠️  Cleanup error (may be normal if user doesn\'t exist):', error.message);
  }
}

async function testSignup() {
  console.log('\n📝 Step 1: Testing Signup...');
  console.log('----------------------------');
  
  try {
    // Call signup API endpoint
    const response = await fetch(`${APP_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password,
        firstName: testUser.firstName,
        lastName: testUser.lastName,
      }),
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Signup failed');
    }
    
    console.log('✅ Signup successful');
    console.log('   User ID:', result.user?.id);
    
    // Verify account was created
    const { data: account } = await serviceClient
      .from('accounts')
      .select('*')
      .eq('id', result.user.id)
      .single();
    
    if (account) {
      console.log('✅ Account created in database');
      console.log('   Plan:', account.plan);
      console.log('   Trial End:', new Date(account.trial_end).toLocaleDateString());
    } else {
      console.log('❌ Account not found in database');
    }
    
    // Verify account_users link was created
    const { data: accountUser } = await serviceClient
      .from('account_users')
      .select('*')
      .eq('user_id', result.user.id)
      .single();
    
    if (accountUser) {
      console.log('✅ Account-User link created');
      console.log('   Role:', accountUser.role);
    } else {
      console.log('❌ Account-User link not found');
    }
    
    return result.user.id;
  } catch (error) {
    console.error('❌ Signup failed:', error.message);
    throw error;
  }
}

async function testLogin() {
  console.log('\n🔐 Step 2: Testing Login...');
  console.log('---------------------------');
  
  try {
    const { data, error } = await anonClient.auth.signInWithPassword({
      email: testUser.email,
      password: testUser.password,
    });
    
    if (error) throw error;
    
    console.log('✅ Login successful');
    console.log('   Session:', data.session ? 'Active' : 'None');
    console.log('   User ID:', data.user?.id);
    
    // Test fetching user accounts (this tests RLS policies)
    console.log('\n🔍 Testing RLS: Fetching user accounts...');
    
    const { data: accountUsers, error: fetchError } = await anonClient
      .from('account_users')
      .select(`
        account_id,
        role,
        accounts!inner (
          id,
          first_name,
          last_name,
          business_name,
          plan
        )
      `)
      .eq('user_id', data.user.id);
    
    if (fetchError) {
      console.error('❌ RLS Error - Cannot fetch accounts:', fetchError);
      throw fetchError;
    }
    
    console.log('✅ RLS Working - Fetched accounts:', accountUsers?.length || 0);
    accountUsers?.forEach((au, i) => {
      console.log(`   Account ${i + 1}:`, {
        id: au.account_id,
        role: au.role,
        name: au.accounts?.business_name || `${au.accounts?.first_name} ${au.accounts?.last_name}`,
        plan: au.accounts?.plan,
      });
    });
    
    return data;
  } catch (error) {
    console.error('❌ Login failed:', error.message);
    throw error;
  }
}

async function testBusinessCreation(userId: string) {
  console.log('\n🏢 Step 3: Testing Business Creation...');
  console.log('---------------------------------------');
  
  try {
    // First, check if we can access the account
    const { data: account, error: accountError } = await anonClient
      .from('accounts')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (accountError) {
      console.error('❌ Cannot access account (RLS issue):', accountError);
      throw accountError;
    }
    
    console.log('✅ Can access account (RLS working)');
    
    // Create business
    const { data: business, error: businessError } = await anonClient
      .from('businesses')
      .insert({
        account_id: userId,
        name: testBusiness.businessName,
        address_street: testBusiness.streetAddress,
        address_city: testBusiness.city,
        address_state: testBusiness.state,
        address_zip: testBusiness.zip,
        phone: testBusiness.phone,
        business_website: testBusiness.website,
        about_us: testBusiness.aboutUs,
      })
      .select()
      .single();
    
    if (businessError) {
      console.error('❌ Business creation failed:', businessError);
      throw businessError;
    }
    
    console.log('✅ Business created successfully');
    console.log('   Business ID:', business.id);
    console.log('   Name:', business.name);
    
    // Update account onboarding step
    const { error: updateError } = await anonClient
      .from('accounts')
      .update({ onboarding_step: 'plan_selection' })
      .eq('id', userId);
    
    if (updateError) {
      console.error('⚠️  Could not update onboarding step:', updateError.message);
    } else {
      console.log('✅ Onboarding step updated to: plan_selection');
    }
    
    return business;
  } catch (error) {
    console.error('❌ Business creation failed:', error.message);
    throw error;
  }
}

async function testPlanSelection(userId: string) {
  console.log('\n💳 Step 4: Testing Plan Selection...');
  console.log('------------------------------------');
  
  try {
    // Simulate selecting free plan
    const { data: account, error } = await anonClient
      .from('accounts')
      .update({
        plan: 'free',
        is_free_account: true,
        onboarding_step: 'completed',
        trial_start: null,
        trial_end: null,
      })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Plan selection failed:', error);
      throw error;
    }
    
    console.log('✅ Free plan selected successfully');
    console.log('   Plan:', account.plan);
    console.log('   Is Free Account:', account.is_free_account);
    console.log('   Onboarding:', account.onboarding_step);
    
    return account;
  } catch (error) {
    console.error('❌ Plan selection failed:', error.message);
    throw error;
  }
}

async function runTest() {
  try {
    // Clean up any existing test data
    await cleanup();
    
    // Run test steps
    const userId = await testSignup();
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for triggers
    
    const session = await testLogin();
    await testBusinessCreation(session.user.id);
    await testPlanSelection(session.user.id);
    
    console.log('\n✅ All tests passed successfully!');
    console.log('==================================');
    console.log('RLS policies are working correctly for account creation flow.');
    
    // Clean up test data
    await cleanup();
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('==================================');
    console.error('There may be an issue with RLS policies or the account creation flow.');
    
    // Try to clean up even if test failed
    await cleanup().catch(() => {});
    
    process.exit(1);
  }
}

// Run the test
runTest();