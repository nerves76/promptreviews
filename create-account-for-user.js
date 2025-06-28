/**
 * Create Account for User Script
 * 
 * This script creates an account for a user who signed in via force sign-in
 * but doesn't have an account yet.
 */

const SUPABASE_URL = 'https://ltneloufqjktdplodvao.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0bmVsb3VmcWprdGRwbG9kdmFvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODA0MTU3OCwiZXhwIjoyMDYzNjE3NTc4fQ.IkGh1VhXoqUSGPudm3NH9BqrUP2GMb1OxfmzJxpwOL4';

const USER_ID = '752f591c-6750-408e-9b70-ab30eb551f62';
const USER_EMAIL = 'chris@murmurcreative.com';

async function createAccountForUser() {
  try {
    console.log('Creating account for user:', USER_ID);
    
    // Create account
    const accountResponse = await fetch(`${SUPABASE_URL}/rest/v1/accounts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        id: USER_ID,
        user_id: USER_ID,
        email: USER_EMAIL,
        trial_start: new Date().toISOString(),
        trial_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        is_free_account: false,
        custom_prompt_page_count: 0,
        contact_count: 0,
        first_name: 'Chris',
        last_name: 'User'
      })
    });

    if (!accountResponse.ok) {
      const errorText = await accountResponse.text();
      console.error('Account creation failed:', accountResponse.status, errorText);
      return;
    }

    console.log('Account created successfully');

    // Create account_users relationship
    const accountUserResponse = await fetch(`${SUPABASE_URL}/rest/v1/account_users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        user_id: USER_ID,
        account_id: USER_ID,
        role: 'owner'
      })
    });

    if (!accountUserResponse.ok) {
      const errorText = await accountUserResponse.text();
      console.error('Account user creation failed:', accountUserResponse.status, errorText);
      return;
    }

    console.log('Account user relationship created successfully');
    console.log('Account creation complete!');

  } catch (error) {
    console.error('Error creating account:', error);
  }
}

createAccountForUser(); 