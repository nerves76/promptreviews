/**
 * Script to verify that all tables documented in RLS_POLICIES.md exist in the database
 * This script checks for the presence of all tables and their basic structure
 */

const { createClient } = require('@supabase/supabase-js');

// Tables documented in RLS_POLICIES.md
const documentedTables = [
  'account_users',
  'accounts', 
  'admins',
  'ai_usage',
  'analytics_events',
  'announcements',
  'businesses',
  'contacts',
  'email_templates',
  'feedback',
  'prompt_pages',
  'quotes',
  'review_submissions',
  'trial_reminder_logs',
  'widget_reviews',
  'widgets'
];

async function verifyTables() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('🔍 Verifying tables documented in RLS_POLICIES.md...\n');

  const results = {
    found: [],
    missing: [],
    errors: []
  };

  for (const tableName of documentedTables) {
    try {
      // Try to select from the table to verify it exists
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (error) {
        if (error.code === '42P01') {
          // Table doesn't exist
          results.missing.push(tableName);
          console.log(`❌ Missing: ${tableName}`);
        } else {
          // Other error (might be RLS policy issue, but table exists)
          results.found.push(tableName);
          console.log(`✅ Found: ${tableName} (with error: ${error.message})`);
        }
      } else {
        results.found.push(tableName);
        console.log(`✅ Found: ${tableName}`);
      }
    } catch (err) {
      results.errors.push({ table: tableName, error: err.message });
      console.log(`⚠️  Error checking ${tableName}: ${err.message}`);
    }
  }

  console.log('\n📊 Summary:');
  console.log(`✅ Found: ${results.found.length}/${documentedTables.length} tables`);
  console.log(`❌ Missing: ${results.missing.length} tables`);
  console.log(`⚠️  Errors: ${results.errors.length} tables`);

  if (results.missing.length > 0) {
    console.log('\n❌ Missing tables:');
    results.missing.forEach(table => console.log(`  - ${table}`));
  }

  if (results.errors.length > 0) {
    console.log('\n⚠️  Tables with errors:');
    results.errors.forEach(({ table, error }) => console.log(`  - ${table}: ${error}`));
  }

  if (results.found.length === documentedTables.length) {
    console.log('\n🎉 All documented tables are present in the database!');
  } else {
    console.log('\n⚠️  Some tables are missing. Consider running the schema restoration script.');
  }

  return results;
}

// Run the verification
if (require.main === module) {
  verifyTables()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Script error:', err);
      process.exit(1);
    });
}

module.exports = { verifyTables, documentedTables }; 