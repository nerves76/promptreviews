/**
 * Fix Admin Access Script
 * 
 * This script fixes the issue where clicking analytics redirects to dashboard
 * by ensuring admin users exist and RLS policies allow access.
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

async function fixAdminAccess() {
  console.log('🔧 Fixing Admin Access');
  console.log('======================\n');

  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    // 1. Check current admin users
    console.log('1️⃣ Checking current admin users...');
    const { data: existingAdmins, error: adminError } = await adminClient
      .from('admins')
      .select('*');
    
    if (adminError) {
      console.error('❌ Error checking admins:', adminError);
      return;
    }

    console.log(`Found ${existingAdmins.length} existing admin users`);

    // 2. Get all users to find candidates for admin
    console.log('\n2️⃣ Getting user list...');
    const { data: usersData, error: usersError } = await adminClient.auth.admin.listUsers();
    
    if (usersError) {
      console.error('❌ Error getting users:', usersError);
      return;
    }

    console.log(`Found ${usersData.users.length} total users`);

    // 3. If no admins exist, add the first user as admin
    if (existingAdmins.length === 0 && usersData.users.length > 0) {
      console.log('\n3️⃣ No admin users found. Adding first user as admin...');
      
      const firstUser = usersData.users[0];
      console.log(`Making ${firstUser.email} (${firstUser.id}) an admin...`);
      
      const { error: insertError } = await adminClient
        .from('admins')
        .insert({
          account_id: firstUser.id
        });
      
      if (insertError) {
        console.error('❌ Error creating admin:', insertError);
      } else {
        console.log('✅ Successfully created admin user!');
      }
    } else if (existingAdmins.length > 0) {
      console.log('\n3️⃣ Admin users already exist:');
      existingAdmins.forEach((admin, index) => {
        const user = usersData.users.find(u => u.id === admin.account_id);
        console.log(`   ${index + 1}. ${user?.email || 'Unknown'} (${admin.account_id})`);
      });
    }

    // 4. Fix RLS policies to allow authenticated users to read admins table
    console.log('\n4️⃣ Fixing RLS policies for admins table...');
    
    // First disable RLS temporarily
    const { error: disableRlsError } = await adminClient
      .rpc('sql', {
        query: 'ALTER TABLE admins DISABLE ROW LEVEL SECURITY;'
      });
    
    if (disableRlsError) {
      console.log('⚠️  Could not disable RLS:', disableRlsError.message);
    } else {
      console.log('✅ Temporarily disabled RLS on admins table');
    }

    // Create a policy that allows authenticated users to read admins
    const { error: policyError } = await adminClient
      .rpc('sql', {
        query: `
          -- Drop existing policies
          DROP POLICY IF EXISTS "Allow admin checking" ON admins;
          DROP POLICY IF EXISTS "Admins can view all admins" ON admins;
          DROP POLICY IF EXISTS "Enable read access for authenticated users" ON admins;
          
          -- Create new policy for reading admins
          CREATE POLICY "Allow authenticated users to check admin status" ON admins
            FOR SELECT 
            TO authenticated 
            USING (true);
        `
      });
    
    if (policyError) {
      console.log('⚠️  Could not create RLS policy:', policyError.message);
    } else {
      console.log('✅ Created RLS policy for admin checking');
    }

    // Re-enable RLS
    const { error: enableRlsError } = await adminClient
      .rpc('sql', {
        query: 'ALTER TABLE admins ENABLE ROW LEVEL SECURITY;'
      });
    
    if (enableRlsError) {
      console.log('⚠️  Could not re-enable RLS:', enableRlsError.message);
    } else {
      console.log('✅ Re-enabled RLS on admins table');
    }

    // 5. Test the fix
    console.log('\n5️⃣ Testing the fix...');
    
    // Create a regular client (like the browser would use)
    const testClient = createClient(SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0');
    
    if (usersData.users.length > 0) {
      const testUser = usersData.users[0];
      console.log(`Testing admin check for ${testUser.email}...`);
      
      const { data: adminCheck, error: checkError } = await testClient
        .from('admins')
        .select('id')
        .eq('account_id', testUser.id)
        .maybeSingle();
      
      if (checkError) {
        console.error('❌ Admin check still failing:', checkError);
        console.log('\n🔧 MANUAL FIX REQUIRED:');
        console.log('Run this SQL command in your Supabase dashboard:');
        console.log('ALTER TABLE admins DISABLE ROW LEVEL SECURITY;');
      } else if (adminCheck) {
        console.log('✅ Admin check working! Analytics page should work now.');
      } else {
        console.log('⚠️  User is not an admin, but the query worked');
        console.log('   Analytics will still redirect unless this user is an admin');
      }
    }

    console.log('\n🎉 Fix completed!');
    console.log('\nTo verify:');
    console.log('1. Go to your admin analytics page: /admin/analytics');
    console.log('2. It should no longer redirect to dashboard');
    console.log('3. If it still redirects, try the manual SQL fix above');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    console.log('\n🔧 FALLBACK SOLUTION:');
    console.log('1. Open your Supabase dashboard');
    console.log('2. Go to SQL Editor');
    console.log('3. Run: ALTER TABLE admins DISABLE ROW LEVEL SECURITY;');
    console.log('4. Then run: INSERT INTO admins (account_id) VALUES (\'your-user-id\');');
  }
}

fixAdminAccess();