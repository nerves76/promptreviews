/**
 * Debug script to check admin table and understand why analytics redirects
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

async function debugAdminIssue() {
  console.log('🔍 Admin Analytics Debug Script');
  console.log('================================\n');

  // Create admin client (with service key)
  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  // Create regular client (what the browser would use)
  const browserClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  try {
    // 1. Check if admins table exists and get all records
    console.log('1️⃣ Checking admins table with service key...');
    const { data: admins, error: adminsError } = await adminClient
      .from('admins')
      .select('*');
    
    if (adminsError) {
      console.error('❌ Error querying admins table:', adminsError);
    } else {
      console.log(`✅ Found ${admins.length} admin records:`);
      admins.forEach((admin, index) => {
        console.log(`   ${index + 1}. ID: ${admin.id}, Account: ${admin.account_id}`);
      });
    }

    // 2. Check users
    console.log('\n2️⃣ Checking recent users...');
    const { data: usersData, error: usersError } = await adminClient.auth.admin.listUsers();
    if (usersError) {
      console.error('❌ Error getting users:', usersError);
    } else {
      console.log(`✅ Found ${usersData.users.length} users (showing first 5):`);
      usersData.users.slice(0, 5).forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} (${user.id})`);
      });
    }

    // 3. Test browser client admin check (simulating what analytics page does)
    console.log('\n3️⃣ Testing browser client admin check...');
    
    if (usersData.users.length > 0) {
      const testUser = usersData.users[0];
      console.log(`Testing with user: ${testUser.email} (${testUser.id})`);
      
      // Simulate the isAdmin check with browser client
      const { data: adminCheck, error: adminCheckError } = await browserClient
        .from('admins')
        .select('id')
        .eq('account_id', testUser.id)
        .maybeSingle();
      
      if (adminCheckError) {
        console.error('❌ Browser client admin check failed:', adminCheckError);
        console.log('   This is likely why analytics redirects to dashboard!');
        console.log('   Error details:');
        console.log('   - Message:', adminCheckError.message);
        console.log('   - Code:', adminCheckError.code);
        console.log('   - Details:', adminCheckError.details);
      } else if (adminCheck) {
        console.log('✅ Browser client found admin record:', adminCheck);
      } else {
        console.log('❌ Browser client: User is not an admin');
        console.log('   This explains why analytics redirects to dashboard');
      }
    }

    // 4. Check RLS policies on admins table
    console.log('\n4️⃣ Checking RLS status on admins table...');
    const { data: rlsCheck, error: rlsError } = await adminClient
      .rpc('sql', {
        query: `
          SELECT 
            schemaname,
            tablename,
            rowsecurity,
            attname as column_name
          FROM pg_tables pt
          LEFT JOIN pg_attribute pa ON pa.attrelid = (
            SELECT oid FROM pg_class WHERE relname = pt.tablename
          )
          WHERE pt.tablename = 'admins' AND pt.schemaname = 'public'
          LIMIT 1;
        `
      });
    
    if (rlsError) {
      console.log('⚠️  Could not check RLS status:', rlsError.message);
    } else {
      console.log('✅ RLS status:', rlsCheck);
    }

    // 5. Suggest solution
    console.log('\n💡 SOLUTION SUGGESTIONS:');
    console.log('========================');
    
    if (admins.length === 0) {
      console.log('🔧 No admin users found. To fix:');
      console.log('   1. Add yourself as an admin:');
      if (usersData.users.length > 0) {
        const firstUser = usersData.users[0];
        console.log(`   INSERT INTO admins (account_id) VALUES ('${firstUser.id}');`);
      }
      console.log('   2. Or run: node create-admin-user.js <email>');
    } else {
      console.log('🔧 Admin users exist but browser client cannot access them.');
      console.log('   This is likely an RLS (Row Level Security) issue.');
      console.log('   To fix:');
      console.log('   1. Disable RLS temporarily: ALTER TABLE admins DISABLE ROW LEVEL SECURITY;');
      console.log('   2. Or fix RLS policies to allow authenticated users to read admins table');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

debugAdminIssue();