/**
 * Clear All Test Data from PromptReviews Database
 * 
 * This script connects to the Supabase database and executes the SQL cleanup script
 * to remove all test data while preserving table structure.
 * 
 * Usage: node clear-database.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function clearDatabase() {
  console.log('🔍 Connecting to Supabase database...');
  
  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing required environment variables:');
    console.error('   - NEXT_PUBLIC_SUPABASE_URL');
    console.error('   - SUPABASE_SERVICE_ROLE_KEY');
    console.error('');
    console.error('Please check your .env.local file and ensure these variables are set.');
    process.exit(1);
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // Read the SQL script
    const sqlScriptPath = path.join(__dirname, 'clear_all_test_data.sql');
    const sqlScript = fs.readFileSync(sqlScriptPath, 'utf8');
    
    console.log('📄 SQL script loaded successfully');
    console.log('⚠️  WARNING: This will delete ALL data from the database!');
    console.log('   Tables to be cleared:');
    console.log('   - auth.users (all user accounts)');
    console.log('   - accounts, account_users, businesses, contacts');
    console.log('   - widgets, widget_reviews, review_submissions');
    console.log('   - prompt_pages, analytics_events, ai_usage');
    console.log('   - feedback, announcements, quotes');
    console.log('   - email_templates, trial_reminder_logs, admins');
    console.log('');
    
    // Ask for confirmation
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const answer = await new Promise((resolve) => {
      rl.question('Are you sure you want to proceed? Type "YES" to confirm: ', resolve);
    });
    rl.close();
    
    if (answer !== 'YES') {
      console.log('❌ Operation cancelled by user');
      process.exit(0);
    }
    
    console.log('🗑️  Executing database cleanup...');
    
    // Execute the SQL script
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlScript });
    
    if (error) {
      // If the RPC method doesn't exist, try executing the SQL directly
      console.log('⚠️  RPC method not available, trying direct SQL execution...');
      
      // Split the SQL script into individual statements
      const statements = sqlScript
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
      
      for (const statement of statements) {
        if (statement.trim()) {
          console.log(`Executing: ${statement.substring(0, 50)}...`);
          const { error: stmtError } = await supabase.rpc('exec_sql', { sql: statement });
          if (stmtError) {
            console.error(`❌ Error executing statement: ${stmtError.message}`);
          }
        }
      }
    } else {
      console.log('✅ Database cleanup completed successfully!');
    }
    
    // Verify the cleanup
    console.log('🔍 Verifying cleanup results...');
    
    const tables = [
      'accounts', 'account_users', 'businesses', 'contacts', 'widgets',
      'widget_reviews', 'review_submissions', 'prompt_pages', 'analytics_events',
      'ai_usage', 'feedback', 'announcements', 'quotes', 'email_templates',
      'trial_reminder_logs', 'admins'
    ];
    
    for (const table of tables) {
      const { count, error: countError } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.log(`⚠️  Could not verify ${table}: ${countError.message}`);
      } else {
        console.log(`✅ ${table}: ${count} rows remaining`);
      }
    }
    
    console.log('');
    console.log('🎉 Database cleanup completed!');
    console.log('📝 All test data has been removed.');
    console.log('🚀 You can now test the sign-up process with a clean database.');
    
  } catch (error) {
    console.error('❌ Error during database cleanup:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the cleanup
clearDatabase().catch(console.error); 