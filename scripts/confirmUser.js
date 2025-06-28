/*
 * confirmUser.js
 *
 * Purpose: Instantly confirm (authorize) a user's email in the Supabase auth.users table for local development/testing.
 * Usage: node scripts/confirmUser.js user@example.com
 *
 * - Only works with a local development database (checks DATABASE_URL for localhost, 127.0.0.1, or :5432).
 * - Safe for local/dev; will refuse to run on remote/production databases.
 *
 * Inputs:
 *   - Email address as a command-line argument
 * Outputs:
 *   - Success or error message in the console
 */
const { Client } = require('pg');

const email = process.argv[2];
if (!email) {
  console.error('Usage: node scripts/confirmUser.js user@example.com');
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL environment variable is not set.');
  process.exit(1);
}

// Restrict to local development only
if (!/localhost|127\.0\.0\.1|:5432/.test(connectionString)) {
  console.error('This script can only be run against a local development database (localhost, 127.0.0.1, or :5432).');
  process.exit(1);
}

const client = new Client({ connectionString });

/**
 * confirmUserEmail
 *
 * Instantly confirms a user's email by setting email_confirmed_at and updated_at to NOW() and clearing confirmation_token.
 *
 * @param {string} email - The email address to confirm
 * @returns {Promise<void>} - Prints result to the console
 */
async function confirmUserEmail(email) {
  try {
    await client.connect();
    const res = await client.query(
      `UPDATE auth.users SET email_confirmed_at = NOW(), updated_at = NOW(), confirmation_token = NULL WHERE email = $1 RETURNING id, email, email_confirmed_at;`,
      [email]
    );
    if (res.rowCount === 0) {
      console.error(`No user found with email: ${email}`);
    } else {
      console.log(`Confirmed email for user:`, res.rows[0]);
    }
  } catch (err) {
    console.error('Error confirming user email:', err);
  } finally {
    await client.end();
  }
}

confirmUserEmail(email); 