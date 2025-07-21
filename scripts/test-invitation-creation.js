const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testInvitationCreation() {
  console.log('🧪 Testing invitation creation process...\n');
  
  try {
    // Test 1: Check if account_invitations table exists and is accessible
    console.log('1. Testing database access...');
    const { data: tableTest, error: tableError } = await supabase
      .from('account_invitations')
      .select('count', { count: 'exact', head: true });
    
    if (tableError) {
      console.error('❌ Cannot access account_invitations table:', tableError);
      return;
    }
    console.log('✅ Table accessible\n');

    // Test 2: Check RLS status
    console.log('2. Checking RLS status...');
    const { data: rlsStatus, error: rlsError } = await supabase
      .rpc('get_table_rls_status', { table_name: 'account_invitations' })
      .single();
    
    console.log('RLS query result:', rlsStatus, rlsError);

    // Test 3: Try to insert a test invitation (simulating the API logic)
    console.log('3. Testing invitation insertion...');
    
    // Generate test data like the API does
    const testEmail = 'test@example.com';
    const testAccountId = 'test-uuid-here'; // This would fail, but let's see the error
    const testToken = 'test-token-123';
    const testExpiresAt = new Date();
    testExpiresAt.setDate(testExpiresAt.getDate() + 7);

    const { data: testInvitation, error: insertError } = await supabase
      .from('account_invitations')
      .insert({
        account_id: testAccountId,
        email: testEmail,
        role: 'member',
        invited_by: 'test-user-id',
        token: testToken,
        expires_at: testExpiresAt.toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.log('❌ Insert failed (expected):', insertError.message);
      
      // Check if it's an RLS issue
      if (insertError.message.includes('policy') || insertError.message.includes('permission')) {
        console.log('🔍 This appears to be an RLS (Row Level Security) issue');
        console.log('The invitation table might still have policies blocking insertions');
      }
      
      // Check if it's a foreign key issue
      if (insertError.message.includes('foreign key') || insertError.message.includes('violates')) {
        console.log('🔍 This appears to be a foreign key constraint issue');
        console.log('The test account/user IDs don\'t exist in the database');
      }
    } else {
      console.log('✅ Test invitation created successfully:', testInvitation);
      
      // Clean up test data
      await supabase
        .from('account_invitations')
        .delete()
        .eq('token', testToken);
      console.log('🧹 Test invitation cleaned up');
    }

    // Test 4: Check if there are any account_users that could send invitations
    console.log('\n4. Checking for account owners...');
    const { data: owners, error: ownersError } = await supabase
      .from('account_users')
      .select('account_id, user_id, role')
      .eq('role', 'owner')
      .limit(5);

    if (ownersError) {
      console.error('❌ Cannot access account_users:', ownersError);
    } else {
      console.log(`✅ Found ${owners?.length || 0} account owners`);
      if (owners && owners.length > 0) {
        console.log('Sample owner:', owners[0]);
      }
    }

    // Test 5: Check for any email template issues
    console.log('\n5. Checking email template...');
    const { data: template, error: templateError } = await supabase
      .from('email_templates')
      .select('name, is_active')
      .eq('name', 'team_invitation')
      .single();

    if (templateError) {
      console.error('❌ Email template issue:', templateError);
    } else {
      console.log('✅ Email template found:', template);
    }

  } catch (err) {
    console.error('💥 Unexpected error:', err);
  }
}

testInvitationCreation(); 