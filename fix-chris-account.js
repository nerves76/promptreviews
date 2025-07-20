require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixChrisAccount() {
  console.log('🔧 Fixing chris@diviner.agency account for proper testing...\n');
  
  try {
    const accountId = '7fb9767a-e78d-472c-871c-f3f17a2f67b9';
    const email = 'chris@diviner.agency';
    
    // 1. Reset plan to no_plan to trigger plan selection flow
    console.log('📝 Step 1: Resetting plan to "no_plan"...');
    const { data: updatedAccount, error: updateError } = await supabase
      .from('accounts')
      .update({ 
        plan: 'no_plan',
        is_admin: true  // Also set admin privileges
      })
      .eq('id', accountId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating account:', updateError.message);
      return;
    }

    console.log('✅ Account updated:');
    console.log('  Plan:', updatedAccount.plan);
    console.log('  Is Admin:', updatedAccount.is_admin);

    // 2. Create admin record for proper admin functionality
    console.log('\n📝 Step 2: Creating admin record...');
    const { data: adminRecord, error: adminError } = await supabase
      .from('admins')
      .upsert({ account_id: accountId })
      .select()
      .single();

    if (adminError) {
      console.log('⚠️  Admin record error (might already exist):', adminError.message);
    } else {
      console.log('✅ Admin record created:', adminRecord.id);
    }

    // 3. Clear any existing businesses to test business creation flow
    console.log('\n📝 Step 3: Checking existing businesses...');
    const { data: businesses, error: businessError } = await supabase
      .from('businesses')
      .select('*')
      .eq('account_id', accountId);

    if (businesses && businesses.length > 0) {
      console.log(`Found ${businesses.length} existing business(es):`);
      businesses.forEach((business, index) => {
        console.log(`  ${index + 1}. ${business.name} (ID: ${business.id})`);
      });
      
      console.log('\n💡 To test the full flow, you might want to:');
      console.log('  1. Delete existing businesses (optional)');
      console.log('  2. Create a new business');
      console.log('  3. You should now see the plan selection modal');
    } else {
      console.log('No existing businesses found');
      console.log('\n✅ Perfect! Create a new business to trigger plan selection');
    }

    console.log('\n🎯 What to test now:');
    console.log('  1. Go to /dashboard/create-business');
    console.log('  2. Create a new business');
    console.log('  3. After creation, you should see the plan selection modal');
    console.log('  4. You now have admin privileges for testing admin features');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

async function deleteBusinesses() {
  console.log('🗑️  Deleting all businesses for chris@diviner.agency...\n');
  
  try {
    const accountId = '7fb9767a-e78d-472c-871c-f3f17a2f67b9';
    
    const { data, error } = await supabase
      .from('businesses')
      .delete()
      .eq('account_id', accountId)
      .select();

    if (error) {
      console.error('❌ Error deleting businesses:', error.message);
      return;
    }

    console.log(`✅ Deleted ${data.length} business(es)`);
    console.log('\n🎯 Now create a new business to test the full flow!');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Check command line arguments
const command = process.argv[2];

if (command === 'delete-businesses') {
  deleteBusinesses();
} else {
  fixChrisAccount();
  console.log('\n💡 Commands available:');
  console.log('   node fix-chris-account.js                    # Fix account settings');
  console.log('   node fix-chris-account.js delete-businesses  # Delete existing businesses');
} 