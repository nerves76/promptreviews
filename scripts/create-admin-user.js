#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdminUser(email, firstName = 'Admin', lastName = 'User') {
  console.log(`🔧 Creating admin user: ${email}`);
  
  try {
    // First, create the user in auth.users
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: 'temporary-password-123!', // User will need to reset this
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName
      }
    });

    if (authError) {
      console.error('❌ Error creating auth user:', authError.message);
      return;
    }

    console.log('✅ Auth user created:', authUser.user.id);

    // Create account record
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .insert({
        id: authUser.user.id,
        email: email,
        first_name: firstName,
        last_name: lastName,
        plan: 'maven',
        user_id: authUser.user.id
      })
      .select()
      .single();

    if (accountError) {
      console.error('❌ Error creating account:', accountError.message);
      return;
    }

    // Create admin record
    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .insert({
        account_id: authUser.user.id
      })
      .select()
      .single();

    if (adminError) {
      console.error('❌ Error creating admin record:', adminError.message);
      return;
    }

    console.log('✅ Admin record created');
    console.log('✅ User is now an admin!');
    console.log(`📧 Email: ${email}`);
    console.log(`🆔 User ID: ${authUser.user.id}`);
    console.log('⚠️  User will need to reset their password on first login');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Get email from command line argument
const email = process.argv[2];
if (!email) {
  console.error('❌ Please provide an email address');
  console.log('Usage: node scripts/create-admin-user.js user@example.com');
  process.exit(1);
}

createAdminUser(email); 