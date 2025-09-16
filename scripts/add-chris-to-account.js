#!/usr/bin/env node

/**
 * Script to add Chris as a support member to any account
 * Usage: node scripts/add-chris-to-account.js <account-email>
 * 
 * This bypasses normal team limits since Chris provides development/support services
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const CHRIS_EMAIL = 'chris@diviner.agency';

async function addChrisToAccount(targetEmail) {
  try {
    if (!targetEmail) {
      console.error('❌ Please provide the account email as an argument');
      console.log('Usage: node scripts/add-chris-to-account.js <account-email>');
      process.exit(1);
    }

    console.log(`\n🔍 Looking for account with email: ${targetEmail}`);

    // Find the target account
    const { data: accounts, error: fetchError } = await supabase
      .from('accounts')
      .select('*')
      .eq('email', targetEmail);

    if (fetchError) {
      console.error('❌ Error fetching account:', fetchError);
      return;
    }

    if (!accounts || accounts.length === 0) {
      console.error(`❌ No account found for email: ${targetEmail}`);
      return;
    }

    const targetAccount = accounts[0];
    console.log(`✅ Found account: ${targetAccount.id}`);
    console.log(`   Name: ${targetAccount.first_name} ${targetAccount.last_name}`);
    console.log(`   Plan: ${targetAccount.plan}`);

    // Get Chris's user ID
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return;
    }

    const chrisUser = users.find(u => u.email === CHRIS_EMAIL);
    
    if (!chrisUser) {
      console.error(`❌ Chris user not found (${CHRIS_EMAIL}). Chris needs to sign up first.`);
      return;
    }

    console.log(`✅ Found Chris's user ID: ${chrisUser.id}`);

    // Check if Chris is already a member
    const { data: existingMembership, error: checkError } = await supabase
      .from('account_users')
      .select('*')
      .eq('account_id', targetAccount.id)
      .eq('user_id', chrisUser.id);

    if (checkError) {
      console.error('❌ Error checking membership:', checkError);
      return;
    }

    if (existingMembership && existingMembership.length > 0) {
      console.log(`⚠️  Chris is already a member of this account with role: ${existingMembership[0].role}`);
      
      // Update role to support if different
      if (existingMembership[0].role !== 'support') {
        const { error: updateError } = await supabase
          .from('account_users')
          .update({ role: 'support' })
          .eq('account_id', targetAccount.id)
          .eq('user_id', chrisUser.id);

        if (updateError) {
          console.error('❌ Error updating role:', updateError);
        } else {
          console.log('✅ Updated Chris\'s role to support');
        }
      }
      return;
    }

    // Add Chris as a support member (bypassing user limits)
    const { error: addError } = await supabase
      .from('account_users')
      .insert({
        account_id: targetAccount.id,
        user_id: chrisUser.id,
        role: 'support' // Special role that doesn't count against limits
      });

    if (addError) {
      console.error('❌ Error adding Chris to account:', addError);
      return;
    }

    console.log(`\n🎉 Successfully added Chris as a support member to ${targetEmail}'s account!`);
    console.log(`   Account ID: ${targetAccount.id}`);
    console.log(`   Role: support`);
    console.log(`\nChris can now log in and switch to this account using the account switcher.`);

  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

// Get email from command line argument
const targetEmail = process.argv[2];
addChrisToAccount(targetEmail);