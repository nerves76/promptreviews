#!/usr/bin/env node
"use strict";

/**
 * Dump account metadata for a given user (defaults to current auth user via service role).
 * Usage: node scripts/debug-linked-account.js [userId]
 */
const path = require('path');
const dotenv = require('dotenv');

// Attempt to load environment variables from common local files if not already present
const envFiles = ['.env.local', '.env'];
for (const file of envFiles) {
  try {
    dotenv.config({ path: path.resolve(process.cwd(), file) });
  } catch (err) {
    // ignore missing files
  }
}

const { createClient } = require('@supabase/supabase-js');

function parseArgs(argv) {
  const args = { userId: null, email: null };
  for (let i = 2; i < argv.length; i++) {
    const value = argv[i];
    if (value === '--email') {
      args.email = argv[i + 1];
      i++;
    } else if (!args.userId) {
      args.userId = value;
    }
  }
  return args;
}

async function main() {
  const { userId: cliUserId, email: cliEmail } = parseArgs(process.argv);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error('Missing Supabase config. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  let finalUserId = cliUserId;

 if (!finalUserId && cliEmail) {
    const { data: userByEmail, error: emailError } = await supabase.auth.admin.listUsers({
      email: cliEmail,
    });

    if (emailError) {
      console.error('Failed to look up user by email:', emailError);
      process.exit(1);
    }

    const matchedUser = userByEmail?.users?.find((user) => user.email === cliEmail);
    if (!matchedUser) {
      console.error(`No auth user found with email ${cliEmail}`);
      process.exit(1);
    }

    finalUserId = matchedUser.id;
  }

  if (!finalUserId) {
    console.error('Unable to determine user id. Pass a user UUID or --email <address>.');
    process.exit(1);
  }

  const { data: accountUsers, error: accountUsersError } = await supabase
    .from('account_users')
    .select('account_id, role')
    .eq('user_id', finalUserId)
    .order('created_at', { ascending: true });

  if (accountUsersError) {
    console.error('Failed to fetch account_users:', accountUsersError);
    process.exit(1);
  }

  if (!accountUsers || accountUsers.length === 0) {
    console.log('No accounts linked to this user.');
    process.exit(0);
  }

  const accountIds = accountUsers.map((item) => item.account_id);
  const { data: accounts, error: accountError } = await supabase
    .from('accounts')
    .select('id, business_name, plan, is_additional_account, has_had_paid_plan, business_creation_complete, trial_start, trial_end, created_at, created_by')
    .in('id', accountIds);

  if (accountError) {
    console.error('Failed to fetch accounts:', accountError);
    process.exit(1);
  }

  const output = { userId: finalUserId, accounts: accounts ?? [] };
  const fs = require('fs');
  fs.mkdirSync('tmp', { recursive: true });
  fs.writeFileSync('tmp/account-dump.json', JSON.stringify(output, null, 2));

  console.log('Account dump written to tmp/account-dump.json');
  console.log(JSON.stringify(output, null, 2));
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
