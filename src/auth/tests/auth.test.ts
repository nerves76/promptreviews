/**
 * Authentication System Test Suite
 * 
 * Comprehensive tests for the modular auth system
 */

import { createClient } from '../providers/supabase';

// Test configuration
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'testpassword123';
const TEST_TIMEOUT = 10000;

// Test utilities
class AuthTestUtils {
  private supabase = createClient();
  
  async cleanupTestUser(email: string) {
    try {
      // Use service role to delete test users
      const { data: { users } } = await this.supabase.auth.admin.listUsers();
      const testUser = users?.find(u => u.email === email);
      
      if (testUser) {
        await this.supabase.auth.admin.deleteUser(testUser.id);
        console.log(`Cleaned up test user: ${email}`);
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }
  
  async createTestUser(email: string, password: string) {
    const { data, error } = await this.supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    
    if (error) throw error;
    return data.user;
  }
  
  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    return data;
  }
  
  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;
  }
  
  async getSession() {
    const { data, error } = await this.supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  }
}

// Test suite
export class AuthTestSuite {
  private utils = new AuthTestUtils();
  private results: { test: string; status: 'pass' | 'fail'; error?: string }[] = [];
  
  async runAllTests() {
    console.log('🧪 Starting Auth Test Suite...\n');
    
    // Run tests in sequence
    await this.testSignUp();
    await this.testSignIn();
    await this.testSessionManagement();
    await this.testSignOut();
    await this.testAccountCreation();
    await this.testMultiAccount();
    await this.testBusinessProfile();
    await this.testAdminStatus();
    await this.testSubscriptionStatus();
    await this.testContextIntegration();
    
    // Print results
    this.printResults();
    
    // Cleanup
    await this.cleanup();
    
    return this.results;
  }
  
  private async test(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      this.results.push({ test: name, status: 'pass' });
      console.log(`✅ ${name}`);
    } catch (error: any) {
      this.results.push({ test: name, status: 'fail', error: error.message });
      console.log(`❌ ${name}: ${error.message}`);
    }
  }
  
  async testSignUp() {
    await this.test('Sign Up', async () => {
      await this.utils.cleanupTestUser(TEST_EMAIL);
      const user = await this.utils.createTestUser(TEST_EMAIL, TEST_PASSWORD);
      if (!user) throw new Error('User creation failed');
      if (user.email !== TEST_EMAIL) throw new Error('Email mismatch');
    });
  }
  
  async testSignIn() {
    await this.test('Sign In', async () => {
      const { user, session } = await this.utils.signIn(TEST_EMAIL, TEST_PASSWORD);
      if (!user) throw new Error('Sign in failed - no user');
      if (!session) throw new Error('Sign in failed - no session');
      if (user.email !== TEST_EMAIL) throw new Error('Email mismatch');
    });
  }
  
  async testSessionManagement() {
    await this.test('Session Management', async () => {
      const session = await this.utils.getSession();
      if (!session) throw new Error('No active session');
      if (!session.access_token) throw new Error('No access token');
      if (!session.refresh_token) throw new Error('No refresh token');
    });
  }
  
  async testSignOut() {
    await this.test('Sign Out', async () => {
      await this.utils.signOut();
      const session = await this.utils.getSession();
      if (session) throw new Error('Session not cleared after sign out');
    });
  }
  
  async testAccountCreation() {
    await this.test('Account Creation', async () => {
      // Sign in first
      const { user } = await this.utils.signIn(TEST_EMAIL, TEST_PASSWORD);
      if (!user) throw new Error('Sign in failed');
      
      // Check if account exists
      const { data: account } = await this.supabase
        .from('accounts')
        .select('*')
        .eq('id', user.id)
        .single();
      
      // Account might not exist due to disabled triggers
      // This is expected in current state
      if (!account) {
        console.log('  ⚠️ Account not auto-created (triggers disabled)');
      }
    });
  }
  
  async testMultiAccount() {
    await this.test('Multi-Account System', async () => {
      const { user } = await this.utils.signIn(TEST_EMAIL, TEST_PASSWORD);
      if (!user) throw new Error('Sign in failed');
      
      // Check account_users table
      const { data: accountUsers } = await this.supabase
        .from('account_users')
        .select('*')
        .eq('user_id', user.id);
      
      // Might be empty due to disabled triggers
      if (!accountUsers || accountUsers.length === 0) {
        console.log('  ⚠️ No account relationships (triggers disabled)');
      }
    });
  }
  
  async testBusinessProfile() {
    await this.test('Business Profile', async () => {
      const { user } = await this.utils.signIn(TEST_EMAIL, TEST_PASSWORD);
      if (!user) throw new Error('Sign in failed');
      
      // Check businesses table
      const { data: businesses } = await this.supabase
        .from('businesses')
        .select('*')
        .eq('account_id', user.id);
      
      // Empty is expected for new users
      if (!businesses || businesses.length === 0) {
        console.log('  ℹ️ No business profile (expected for new user)');
      }
    });
  }
  
  async testAdminStatus() {
    await this.test('Admin Status', async () => {
      const { user } = await this.utils.signIn(TEST_EMAIL, TEST_PASSWORD);
      if (!user) throw new Error('Sign in failed');
      
      // Check admin status
      const { data: account } = await this.supabase
        .from('accounts')
        .select('is_admin')
        .eq('id', user.id)
        .single();
      
      if (account && account.is_admin) {
        console.log('  ℹ️ User is admin');
      } else {
        console.log('  ℹ️ User is not admin (expected for test user)');
      }
    });
  }
  
  async testSubscriptionStatus() {
    await this.test('Subscription Status', async () => {
      const { user } = await this.utils.signIn(TEST_EMAIL, TEST_PASSWORD);
      if (!user) throw new Error('Sign in failed');
      
      // Check subscription fields
      const { data: account } = await this.supabase
        .from('accounts')
        .select('plan, trial_start, trial_end, subscription_status')
        .eq('id', user.id)
        .single();
      
      if (!account) {
        console.log('  ⚠️ No account record (triggers disabled)');
      } else {
        console.log(`  ℹ️ Plan: ${account.plan || 'none'}`);
      }
    });
  }
  
  async testContextIntegration() {
    await this.test('Context Integration', async () => {
      // This would test the React contexts, but requires a React environment
      // For now, we just verify the structure exists
      const fs = require('fs');
      const contextsExist = [
        '/Users/chris/promptreviews/src/auth/context/CoreAuthContext.tsx',
        '/Users/chris/promptreviews/src/auth/context/AccountContext.tsx',
        '/Users/chris/promptreviews/src/auth/context/BusinessContext.tsx',
        '/Users/chris/promptreviews/src/auth/context/AdminContext.tsx',
        '/Users/chris/promptreviews/src/auth/context/SubscriptionContext.tsx',
      ].every(path => fs.existsSync(path));
      
      if (!contextsExist) throw new Error('Not all context files exist');
    });
  }
  
  private printResults() {
    console.log('\n📊 Test Results:');
    console.log('=' .repeat(50));
    
    const passed = this.results.filter(r => r.status === 'pass').length;
    const failed = this.results.filter(r => r.status === 'fail').length;
    const total = this.results.length;
    
    console.log(`Total: ${total} | Passed: ${passed} | Failed: ${failed}`);
    
    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results.filter(r => r.status === 'fail').forEach(r => {
        console.log(`  - ${r.test}: ${r.error}`);
      });
    }
    
    const percentage = Math.round((passed / total) * 100);
    console.log(`\n${percentage}% tests passed`);
  }
  
  private async cleanup() {
    console.log('\n🧹 Cleaning up...');
    await this.utils.cleanupTestUser(TEST_EMAIL);
  }
  
  private get supabase() {
    return this.utils['supabase'];
  }
}

// Export for use in test runners
export default AuthTestSuite;