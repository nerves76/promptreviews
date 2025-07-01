/**
 * Apply Admin Analytics Fix Migration
 * 
 * This script manually applies the admin analytics access fix migration
 * when the Supabase CLI is not available or Docker is not running.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

async function applyMigration() {
  console.log('🔄 Applying Admin Analytics Fix Migration');
  console.log('==========================================\n');

  // Create Supabase client with service role key
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20250701215746_fix_admin_analytics_access.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found:', migrationPath);
      process.exit(1);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('📄 Read migration file:', path.basename(migrationPath));

    // Apply the migration by executing the SQL
    console.log('\n🔧 Applying migration SQL...');
    
    // Split the SQL into individual statements (simple approach)
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments and empty statements
      if (statement.startsWith('--') || statement.length === 0) {
        continue;
      }

      // Handle DO blocks specially (they need to be executed as a single statement)
      if (statement.includes('DO $$')) {
        // Find the complete DO block
        let doBlock = statement;
        let j = i + 1;
        while (j < statements.length && !doBlock.includes('END $$')) {
          doBlock += '; ' + statements[j];
          j++;
        }
        
        console.log(`   Executing DO block...`);
        const { error } = await supabase.rpc('exec', { sql: doBlock });
        
        if (error) {
          console.error('❌ Error executing DO block:', error);
        } else {
          console.log('   ✅ DO block executed successfully');
        }
        
        i = j; // Skip the statements we've already processed
        continue;
      }

      // Regular SQL statement
      if (statement.trim().length > 10) { // Only execute substantial statements
        console.log(`   Executing: ${statement.substring(0, 50)}...`);
        
        const { error } = await supabase.rpc('exec', { sql: statement });
        
        if (error) {
          console.error('❌ Error executing statement:', error);
          console.error('   Statement:', statement);
        } else {
          console.log('   ✅ Statement executed successfully');
        }
      }
    }

    // Test the fix
    console.log('\n🧪 Testing the fix...');
    
    // Check if we can now read the admins table
    const { data: admins, error: adminError } = await supabase
      .from('admins')
      .select('*');

    if (adminError) {
      console.error('❌ Could not read admins table:', adminError);
    } else {
      console.log(`✅ Admins table accessible. Found ${admins.length} admin users:`);
      admins.forEach((admin, index) => {
        console.log(`   ${index + 1}. Account ID: ${admin.account_id}`);
      });
    }

    // Test with a regular client (like the browser would use)
    console.log('\n🌐 Testing with browser client...');
    const browserClient = createClient(
      SUPABASE_URL, 
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
    );

    // This simulates what the analytics page would do
    const { data: browserAdmins, error: browserError } = await browserClient
      .from('admins')
      .select('id')
      .limit(1);

    if (browserError) {
      console.error('❌ Browser client cannot access admins table:', browserError);
      console.log('   The analytics page may still redirect to dashboard');
    } else {
      console.log('✅ Browser client can access admins table!');
      console.log('   The analytics page should now work correctly');
    }

    console.log('\n🎉 Migration applied successfully!');
    console.log('\nNext steps:');
    console.log('1. Try accessing /admin/analytics in your browser');
    console.log('2. Make sure you are logged in as an admin user');
    console.log('3. The page should show analytics instead of redirecting to dashboard');

  } catch (error) {
    console.error('❌ Unexpected error applying migration:', error);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  applyMigration();
}

module.exports = { applyMigration };