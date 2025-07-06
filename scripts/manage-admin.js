#!/usr/bin/env node

/**
 * Admin Management Script
 * 
 * This script provides a simple way to manage admin status for users
 * using the new simple is_admin column in the accounts table.
 * 
 * Usage:
 *   node scripts/manage-admin.js list                    - List all admins
 *   node scripts/manage-admin.js grant user@example.com  - Grant admin status
 *   node scripts/manage-admin.js revoke user@example.com - Revoke admin status
 *   node scripts/manage-admin.js check user@example.com  - Check admin status
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client with service role key for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration. Please check your environment variables.');
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function listAdmins() {
  console.log('📋 Listing all admin users...\n');
  
  try {
    const { data, error } = await supabase
      .from('accounts')
      .select('id, email, first_name, last_name, created_at')
      .eq('is_admin', true)
      .order('email');

    if (error) {
      console.error('❌ Error listing admins:', error.message);
      return;
    }

    if (!data || data.length === 0) {
      console.log('No admin users found.');
      return;
    }

    console.log(`Found ${data.length} admin user(s):`);
    console.log('─'.repeat(80));
    
    data.forEach(admin => {
      const name = admin.first_name && admin.last_name 
        ? `${admin.first_name} ${admin.last_name}`
        : 'No name';
      const created = new Date(admin.created_at).toLocaleDateString();
      console.log(`✓ ${admin.email}`);
      console.log(`  Name: ${name}`);
      console.log(`  ID: ${admin.id}`);
      console.log(`  Created: ${created}`);
      console.log();
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

async function setAdminStatus(email, isAdmin) {
  const action = isAdmin ? 'Granting' : 'Revoking';
  console.log(`${action} admin status for: ${email}\n`);
  
  try {
    // First, check if the user exists
    const { data: existing, error: findError } = await supabase
      .from('accounts')
      .select('id, email, is_admin')
      .eq('email', email)
      .maybeSingle();

    if (findError) {
      console.error('❌ Error finding user:', findError.message);
      return;
    }

    if (!existing) {
      console.error(`❌ No account found with email: ${email}`);
      console.log('   Make sure the user has signed up and created an account first.');
      return;
    }

    // Check if already in desired state
    if (existing.is_admin === isAdmin) {
      console.log(`ℹ️  User ${email} is already ${isAdmin ? 'an admin' : 'not an admin'}.`);
      return;
    }

    // Update the admin status
    const { data, error } = await supabase
      .from('accounts')
      .update({ is_admin: isAdmin })
      .eq('email', email)
      .select('id, email, is_admin');

    if (error) {
      console.error('❌ Error updating admin status:', error.message);
      return;
    }

    if (!data || data.length === 0) {
      console.error('❌ No rows updated. Something went wrong.');
      return;
    }

    console.log(`✅ Successfully ${isAdmin ? 'granted' : 'revoked'} admin status for ${email}`);
    console.log(`   User ID: ${data[0].id}`);
    console.log(`   Admin status: ${data[0].is_admin ? 'Yes' : 'No'}`);

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

async function checkAdminStatus(email) {
  console.log(`🔍 Checking admin status for: ${email}\n`);
  
  try {
    const { data, error } = await supabase
      .from('accounts')
      .select('id, email, is_admin, first_name, last_name, created_at')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      console.error('❌ Error checking user:', error.message);
      return;
    }

    if (!data) {
      console.error(`❌ No account found with email: ${email}`);
      return;
    }

    const name = data.first_name && data.last_name 
      ? `${data.first_name} ${data.last_name}`
      : 'No name';
    const created = new Date(data.created_at).toLocaleDateString();
    
    console.log('User Information:');
    console.log('─'.repeat(40));
    console.log(`Email: ${data.email}`);
    console.log(`Name: ${name}`);
    console.log(`ID: ${data.id}`);
    console.log(`Created: ${created}`);
    console.log(`Admin Status: ${data.is_admin ? '✅ Yes' : '❌ No'}`);

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

function showUsage() {
  console.log('Admin Management Script');
  console.log('======================');
  console.log();
  console.log('Usage:');
  console.log('  node scripts/manage-admin.js list                    - List all admins');
  console.log('  node scripts/manage-admin.js grant user@example.com  - Grant admin status');
  console.log('  node scripts/manage-admin.js revoke user@example.com - Revoke admin status');
  console.log('  node scripts/manage-admin.js check user@example.com  - Check admin status');
  console.log();
  console.log('Examples:');
  console.log('  node scripts/manage-admin.js grant chris@diviner.agency');
  console.log('  node scripts/manage-admin.js revoke old-admin@example.com');
  console.log('  node scripts/manage-admin.js list');
}

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];
const email = args[1];

async function main() {
  switch (command) {
    case 'list':
      await listAdmins();
      break;
    
    case 'grant':
      if (!email) {
        console.error('❌ Email address is required for grant command');
        showUsage();
        process.exit(1);
      }
      await setAdminStatus(email, true);
      break;
    
    case 'revoke':
      if (!email) {
        console.error('❌ Email address is required for revoke command');
        showUsage();
        process.exit(1);
      }
      await setAdminStatus(email, false);
      break;
    
    case 'check':
      if (!email) {
        console.error('❌ Email address is required for check command');
        showUsage();
        process.exit(1);
      }
      await checkAdminStatus(email);
      break;
    
    default:
      console.error('❌ Unknown command:', command);
      showUsage();
      process.exit(1);
  }
}

main().catch(console.error); 